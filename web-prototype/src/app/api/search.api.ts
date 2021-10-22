import {Injectable} from "@angular/core";
import {Apollo, ApolloBase} from "apollo-angular";
import {map} from "rxjs/operators";
import {ApolloQueryResult, DocumentNode, gql} from "@apollo/client/core";
import {Observable, of} from "rxjs";
import {
    DatasetIDsInterface,
    PageInfoInterface, SearchDatasetByID,
    SearchOverviewDatasetsInterface, SearchOverviewInterface, TypeNames,
} from "../interface/search.interface";
import AppValues from "../common/app.values";

@Injectable()
export class SearchApi {
    // tslint:disable-next-line: no-any
    private apollo: ApolloBase<any>;

    constructor(private apolloProvider: Apollo) {
        this.apollo = this.apolloProvider.use('newClientName');
    }

    // tslint:disable-next-line: no-any
    public seatchIndex(): Observable<any> {
        const GET_DATA: DocumentNode = gql``

        // tslint:disable-next-line: no-any
        return this.apollo.watchQuery({query: GET_DATA})
            .valueChanges.pipe(map((result: any) => {
                if (result.data) {
                    return result.data.search.query.edges.map((edge: any) => {
                        let d = Object();
                        d.id = edge.node.id;
                        return d;
                    })
                }
            }));
    }
    public searchOverview(searchQuery: string, page: number = 0): Observable<SearchOverviewInterface> {
        const GET_DATA: DocumentNode = gql`
  {
  search {
    query(query: "${searchQuery}", perPage: 2, page: ${(page).toString()}) {
     edges {
        node {
          __typename
          ... on Dataset {
            id
            kind 
            createdAt
            lastUpdatedAt
            __typename
          }
        }
        __typename
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
      }
      __typename
    }
    __typename
  }
}
`;

        return this.apollo.watchQuery({query: GET_DATA})
            .valueChanges.pipe(map((result: any) => {
                let dataset: SearchOverviewDatasetsInterface[] = [];
                let pageInfo: PageInfoInterface = SearchApi.pageInfoInit();
                let totalCount: number = 0;
                let currentPage: number = 1;

                if (result.data) {
                    // tslint:disable-next-line: no-any
                    dataset = result.data.search.query.edges.map((edge: any) => {
                        return this.clearlyData(edge);
                    })
                    pageInfo = result.data.search.query.pageInfo;
                    totalCount = result.data.search.query.totalCount;
                    currentPage = page;
                }

                return SearchApi.searchOverviewData(dataset, pageInfo, totalCount, currentPage);
            }));
    }
    private static searchOverviewData(dataset: SearchOverviewDatasetsInterface[], pageInfo: PageInfoInterface, totalCount: number, currentPage: number): SearchOverviewInterface {
        return {
            dataset: dataset,
            pageInfo: pageInfo,
            totalCount: totalCount,
            currentPage: currentPage + 1
        };
    }
    private static pageInfoInit(): PageInfoInterface {
        return {
            hasNextPage: false,
            hasPreviousPage: false,
            totalPages: 0
        }
    }
    public autocompleteDatasetSearch(id: string): Observable<DatasetIDsInterface[]> {
        if(id === '') {
            return of([]);
        }
        const GET_DATA: DocumentNode = gql`
{
  search {
    query(query: "${id}", perPage: 10) {
      nodes {
        ... on Dataset {
          id
        }
      }
    }
  }
}`

        // tslint:disable-next-line: no-any
        return this.apollo.watchQuery({query: GET_DATA})
            .valueChanges.pipe(map((result: ApolloQueryResult<any>) => {
                if (result.data) {
                    return SearchApi.searchValueAddToAutocomplete(result.data.search.query.nodes || [], id);
                } else {
                    return [];
                }
            }));
    }
    private static searchValueAddToAutocomplete(ngTypeaheadList: DatasetIDsInterface[], searchValue: string): DatasetIDsInterface[] {
        let newArray: DatasetIDsInterface[] = JSON.parse(JSON.stringify(ngTypeaheadList));
        if (searchValue) {
            newArray.unshift({__typename: TypeNames.allDataType, id: searchValue});
        }
        return newArray;
    }

    // tslint:disable-next-line: no-any
    public searchLinageDataset(id: string): Observable<any> {
        const GET_DATA: DocumentNode = gql`
{
  datasets {
    byId(id: "${id}") {
      id
      kind
      metadata {
        currentUpstreamDependencies {
          id
          kind
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
`;
        // tslint:disable-next-line: no-any
        return this.apollo.watchQuery({query: GET_DATA})
            .valueChanges.pipe(map((result: ApolloQueryResult<any>) => {
                if (result.data) {
                    return result.data;
                }
            }));
    }

    public searchDataset(params: {id: string, numRecords?: number, page?: number}): Observable<SearchDatasetByID> {
        const GET_DATA: DocumentNode = gql`
{
  datasets {
  byId(id: "${params.id}") {
    id
    createdAt
    lastUpdatedAt
    metadata {
      currentWatermark
      currentSchema(format: "PARQUET_JSON") {
        format
        content
        __typename
      }
      __typename
    }
    data {
      numRecordsTotal
      estimatedSize
      tail(numRecords: ${params.numRecords || 10}, format: "JSON") {
        format
        content
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

}`
        // @ts-ignore
        return this.apollo.watchQuery({query: GET_DATA})
            .valueChanges.pipe(map((result: ApolloQueryResult<any>) => {
                if (result.data) {
                    // tslint:disable-next-line: no-any
                    let datasets: any = AppValues.deepCopy(result.data.datasets.byId);
                    datasets['data'].tail.content = JSON.parse(result.data.datasets.byId['data'].tail.content);
                    datasets['metadata'].currentSchema.content = JSON.parse(result.data.datasets.byId['metadata'].currentSchema.content);

                    return datasets as SearchDatasetByID;
                }
            }));
    }

    // tslint:disable-next-line: no-any
    public onSearchMetadata(id: string): Observable<any> {
        const GET_DATA: DocumentNode = gql`
{
  datasets {
    byId(id: "${id}") {
      metadata {
        chain {
          blocks {
            edges {
              node {
                blockHash
                systemTime
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
`;
        // tslint:disable-next-line: no-any
        return this.apollo.watchQuery({query: GET_DATA})
            .valueChanges.pipe(map((result: ApolloQueryResult<any>) => {
                if (result.data) {
                    return result.data.datasets.byId.metadata.chain.blocks.edges.map((edge: any) => {
                        return this.clearlyData(edge);
                    });
                }
            }));
    }

    // tslint:disable-next-line: no-any
    clearlyData(edge: any) {
        const object = edge.node;
        const value = 'typename';
        const nodeKeys: string[] = Object.keys(object).filter(key => !key.includes(value));
        let d = Object();

        nodeKeys.forEach((nodeKey: string) => {
            d[nodeKey] = edge.node[nodeKey];
        })

        return d;
    }

}
