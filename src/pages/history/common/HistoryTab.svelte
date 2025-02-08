<script lang="ts">
  import { Grid, Input, Button } from "@swyft-logistics/styleguide";

  export let downloadDocumentHandler: Function;
  export let getLabelHandler: Function = () => {};
  export let columns;
  export let dataSource;
  export let tableMetadata;


  export let pageChangedHandler: Function = () => {};
  export let handleContextMenuItemClick: Function = () => {};
</script>

<slot name="filters" />

<div class="b-pd-2" />
<Grid
  {columns}
  {dataSource}
  {tableMetadata}
  pagination={true}
  on:context-menu-item-click={handleContextMenuItemClick}
  on:page-changed={pageChangedHandler}
  on:download-document={downloadDocumentHandler}
  on:download-label={getLabelHandler}
/>

<style>
  .button {
    max-width: 120px;
    margin-top: 22px;
    display: inline-block;
  }

  .b-pd-2 {
    padding-bottom: 2rem;
  }

  .grid-container {
    display: grid;
    grid-template-columns: auto auto auto auto;
    column-gap: 1rem;
  }
  .grid-item {
    padding-bottom: 1rem;
  }

  :global(.log.info) {
    --toastBackground: green;
  }
  :global(.log.warn) {
    --toastBackground: red;
  }
</style>
