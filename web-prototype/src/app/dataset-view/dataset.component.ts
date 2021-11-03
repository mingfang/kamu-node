import {AfterContentInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {DatasetInfoInterface, SearchHistoryInterface} from "../interface/search.interface";
import AppValues from "../common/app.values";
import {SearchAdditionalButtonInterface} from "../components/search-additional-buttons/search-additional-buttons.interface";
import {MatSidenav} from "@angular/material/sidenav";
import {SideNavService} from "../services/sidenav.service";
import {searchAdditionalButtonsEnum} from "../search/search.interface";
import {DatasetViewTypeEnum} from "./dataset-view.interface";
import {AppDatasetService} from "./dataset.service";
import {Router} from "@angular/router";
import {Edge} from "@swimlane/ngx-graph/lib/models/edge.model";
import {Node} from "@swimlane/ngx-graph/lib/models/node.model";


@Component({
    selector: 'app-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset-view.component.sass']
})
export class DatasetComponent implements OnInit, AfterContentInit {

    @ViewChild('sidenav', {static: true}) public sidenav?: MatSidenav;
    public isMobileView = false;
    public datasetInfo: DatasetInfoInterface;
    public searchValue = '';
    public isMinimizeSearchAdditionalButtons = false;
    public datasetViewType: DatasetViewTypeEnum = DatasetViewTypeEnum.overview;
    public searchAdditionalButtonsData: SearchAdditionalButtonInterface[] = [{
        textButton: searchAdditionalButtonsEnum.Descission
    }, {
        textButton: searchAdditionalButtonsEnum.Reputation
    }, {
        textButton: searchAdditionalButtonsEnum.Explore,
        styleClassContainer: 'app-active-button__container',
        styleClassButton: 'app-active-button'
    }, {
        textButton: searchAdditionalButtonsEnum.DeriveForm,
        styleClassContainer: 'app-active-button__container',
        styleClassButton: 'app-active-button'
    }];

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    public tableData: {
        isTableHeader: boolean,
        displayedColumns?: any[],
        tableSource: any,
        isResultQuantity: boolean,
        isClickableRow: boolean
    };
    public searchData: SearchHistoryInterface[] = [];

    public linageGraphView: [number, number] = [500, 600];
    public linageGraphLink: Edge[] = [];
    public linageGraphNodes: Node[] = [];
    public isAvailableLinageGraph = false;


    private _window: Window;

    @HostListener('window:resize', ['$event'])
    private checkWindowSize(): void {
        this.isMinimizeSearchAdditionalButtons = AppValues.isMobileView();
        this.isMobileView = AppValues.isMobileView();

        if (AppValues.isMobileView()) {
            this.sidenavService.close();
        } else {
            this.sidenavService.open();
        }
        this.changeLinageGraphView();
    }

    constructor(
        private appDatasetService: AppDatasetService,
        private sidenavService: SideNavService,
        private router: Router) {
        this._window = window;
    }


    public ngOnInit(): void {
        if (this.sidenav) {
            this.sidenavService.setSidenav(this.sidenav);
            this.checkWindowSize();
        }
        this.initDatasetViewByType();

        this.initTableData();

        this.appDatasetService.onSearchDatasetInfoChanges.subscribe((info: DatasetInfoInterface) => {
            this.datasetInfo = info;
        })
        this.appDatasetService.onSearchChanges.subscribe((value: string) => {
            this.searchValue = value;
        })

        /* eslint-disable  @typescript-eslint/no-explicit-any */
        this.appDatasetService.onSearchDataChanges.subscribe((data: any[]) => {
            this.tableData.tableSource = data;
        });
    }

    public changeLinageGraphView(): void {

        if (this.datasetViewType === DatasetViewTypeEnum.linage) {

            setTimeout(() => {
                const searchResultContainer: HTMLElement | null = document.getElementById('searchResultContainerContent');
                if (searchResultContainer !== null) {

                    const styleElement: CSSStyleDeclaration = getComputedStyle(searchResultContainer);
                    this.linageGraphView[0] = searchResultContainer.offsetWidth
                        - parseInt(styleElement.paddingLeft)
                        - parseInt(styleElement.paddingRight);
                    this.linageGraphView[1] = 400;
                }
            });
        }
    }

    public getDatasetTree(): string[][] {
        return this.appDatasetService.getDatasetTree;
    }

    public ngAfterContentInit(): void {
        this.tableData.tableSource = this.searchData
    }

    private initTableData(): void {
        this.tableData = {
            isTableHeader: true,
            tableSource: this.searchData,
            isResultQuantity: true,
            isClickableRow: false
        };
    }

    public getResultUnitText(): string {
        const searchDataset: string = this.getDatasetId();
        return `results in ${searchDataset}`
    }

    private initDatasetViewByType(): void {
        const searchParams: string[] = this._window.location.search.split('&type=');

        if (searchParams.length > 1) {
            const type: DatasetViewTypeEnum = AppValues.fixedEncodeURIComponent(searchParams[1].split('&')[0]) as DatasetViewTypeEnum;

            this.datasetViewType = type;
            if (type === DatasetViewTypeEnum.overview) {
                this.onSearchDataset();
            }
            if (type === DatasetViewTypeEnum.metadata) {
                this.onSearchMetadata();
            }
            if (type === DatasetViewTypeEnum.linage) {
                this.onSearchLinageDataset();
            }
            if (type === DatasetViewTypeEnum.projections) {
                this.onSearchProjections();
            }
        }
    }

    private getDatasetId(): string {
        const searchParams: string[] = this._window.location.search.split('?id=');

        if (searchParams.length > 1) {
            return AppValues.fixedEncodeURIComponent(searchParams[1].split('&')[0]);
        }
        return '';
    }

    public momentConverDatetoLocalWithFormat(date: string): string {
        return AppValues.momentConverDatetoLocalWithFormat({
            date: new Date(date),
            format: 'DD MMM YYYY',
            isTextDate: true
        });
    }


    public onClickSearchAdditionalButton(method: string) {
        if (method === searchAdditionalButtonsEnum.DeriveForm) {
            this.onClickDeriveForm();
        }
        if (method === searchAdditionalButtonsEnum.Reputation) {
            this.onClickReputation();
        }
        if (method === searchAdditionalButtonsEnum.Explore) {
            this.onClickExplore();
        }
        if (method === searchAdditionalButtonsEnum.Descission) {
            this.onClickDescission();
        }
    }

    public get datasetViewTypeOverview(): boolean {
        return this.datasetViewType === DatasetViewTypeEnum.overview;
    }

    public get datasetViewTypeMetadata(): boolean {
        return this.datasetViewType === DatasetViewTypeEnum.metadata;
    }

    public get datasetViewTypeLinage(): boolean {
        return this.datasetViewType === DatasetViewTypeEnum.linage;
    }

    private onClickDeriveForm(): void {
        console.log('onClickDeriveForm');
    }

    private onClickExplore(): void {
        console.log('onClickExplore');
    }

    private onClickReputation(): void {
        console.log('onClickReputation');
    }

    private onClickDescission(): void {
        console.log('onClickDescission');
    }

    public onSearchMetadata(): void {
        this.router.navigate([AppValues.urlDatasetView], {
            queryParams: {
                id: this.getDatasetId(),
                type: AppValues.urlDatasetViewMetadataType
            }
        });

        this.datasetViewType = DatasetViewTypeEnum.metadata;
        this.appDatasetService.onSearchMetadata(this.getDatasetId());
    }

    public onSearchDataset(page = 0): void {
        this.router.navigate([AppValues.urlDatasetView], {
            queryParams: {
                id: this.getDatasetId(),
                type: AppValues.urlDatasetViewOverviewType
            }
        });

        this.datasetViewType = DatasetViewTypeEnum.overview;

        this.appDatasetService.searchDataset(this.getDatasetId(), page);
    }

    public onSearchLinageDataset(): void {
        this.router.navigate([AppValues.urlDatasetView], {
            queryParams: {
                id: this.getDatasetId(),
                type: DatasetViewTypeEnum.linage
            }
        });

        this.datasetViewType = DatasetViewTypeEnum.linage;
        this.appDatasetService.resetDatasetTree();
        this.appDatasetService.onSearchLinageDataset(this.getDatasetId());

        this.prepareLinageGraph();
        this.changeLinageGraphView();
    }

    public onSearchProjections(): void {
        console.log('Projections Tab');
        this.onSearchDataset();
    }

    private prepareLinageGraph(): void {
        let uniqDatasetIdList: string[] = [];

        this.appDatasetService.onDatasetTreeChanges.subscribe((datasetTree: string[][]) => {
            this.isAvailableLinageGraph = (datasetTree.length !== 0);
            datasetTree.forEach((term: string[]) => term.forEach((id: string) => uniqDatasetIdList.push(id)));
            uniqDatasetIdList = uniqDatasetIdList.filter((x: any, y: number) => uniqDatasetIdList.indexOf(x) == y);

            this.linageGraphNodes = [];
            this.linageGraphLink = [];

            datasetTree.forEach((term: string[], index: number) => {
                this.linageGraphLink.push({
                    id: `${term[0]}__and__${term[1]}__${index}`,
                    source: term[0],
                    target: term[1],
                    label: `${term[0]}__and__${term[1]}__${index}`
                });
            });

            uniqDatasetIdList.forEach((id: string) => {
                this.linageGraphNodes.push({
                    id: id,
                    label: id
                });
            });
        });
    }
}
