use async_graphql::*;
use chrono::prelude::*;
use kamu::domain;
use kamu::infra;

use super::*;

#[derive(SimpleObject)]
#[graphql(complex)]
pub(crate) struct DatasetMetadata {
    pub dataset_id: DatasetID,
}

#[ComplexObject]
impl DatasetMetadata {
    #[graphql(skip)]
    pub fn new(dataset_id: DatasetID) -> Self {
        Self { dataset_id }
    }

    #[graphql(skip)]
    fn get_chain(&self, ctx: &Context<'_>) -> Result<Box<dyn domain::MetadataChain>> {
        let metadata_repo = from_catalog::<dyn domain::MetadataRepository>(ctx).unwrap();
        Ok(metadata_repo.get_metadata_chain(&self.dataset_id)?)
    }

    /// Access to the temporal metadata chain of the dataset
    async fn chain(&self) -> MetadataChain {
        MetadataChain::new(self.dataset_id.clone())
    }

    /// Last recorded watermark
    async fn current_watermark(&self, ctx: &Context<'_>) -> Result<Option<DateTime<Utc>>> {
        let chain = self.get_chain(ctx)?;
        Ok(chain
            .iter_blocks_ref(&domain::BlockRef::Head)
            .filter_map(|b| b.output_watermark)
            .next())
    }

    /// Latest data schema
    async fn current_schema(
        &self,
        ctx: &Context<'_>,
        format: Option<DataSchemaFormat>,
    ) -> Result<DataSchema> {
        let query_svc = from_catalog::<dyn domain::QueryService>(ctx).unwrap();
        let schema = query_svc.get_schema(&self.dataset_id)?;

        let format = format.unwrap_or(DataSchemaFormat::Parquet);
        let mut buf = Vec::new();

        match format {
            DataSchemaFormat::Parquet => {
                infra::utils::schema_utils::write_schema_parquet(&mut buf, &schema)
            }
            DataSchemaFormat::ParquetJson => {
                infra::utils::schema_utils::write_schema_parquet_json(&mut buf, &schema)
            }
        }
        .unwrap();

        Ok(DataSchema {
            format,
            content: String::from_utf8(buf).unwrap(),
        })
    }
}
