<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { PanelContainer } from "@swyft-logistics/styleguide";
  import { getPanelSetting, getBag } from "./api";
  import { cities, warehouses } from "../../store";

  export let progress: any;
  export let bagId: string = "";

  let dataSource: any = null;
  let limit;
  let skip;
  let columnSetting;
  let actions = [];
  let cityIdHash = {};
  let warehouseMap = {};
  let requestData = null;

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const dispatch = createEventDispatcher();

  onMount(async () => {
    columnSetting = await getPanelSetting();
    skip = 0;
    limit = 50;

    dispatch("show-loader");
    requestData = await getBag(bagId);
    dispatch("hide-loader");
  });

  async function setDataSource(data) {
    actions = [];
    data.createdAt = new Date(data.createdAt).toLocaleDateString(
      "en-US",
      dateOptions
    );
    data.parcelCount = data.parcelIds.length;
    data.originHub =
      warehouseMap[`${data.originCity}-${data.originWarehouse}`].name;
    data.originCity = `${cityIdHash[data.originCity].name}`;
    data.destinationCity = `${cityIdHash[data.destinationCity].name}`;

    data.statusHistory = data.statusHistory.map((item) => {
      item.createdAt = new Date(item.createdAt).toLocaleDateString(
        "en-US",
        dateOptions
      );
      if(item.location){
      item.location =
      warehouseMap[`${item.location.cityCode}-${item.location.warehouseCode}`].name;
      }
      return item;
    });

    dataSource = { ...data };
  }

  function linkGenerator({ rowId, columnIndex, text }) {
    return `/parcel-management/parcels/${text}`;
  }

  $: $cities.forEach((city) => {
    cityIdHash[city.cityCode] = {
      name: city.name,
      code: city.code,
    };
  });

  $: $warehouses.forEach((warehouse) => {
    warehouseMap[`${warehouse.cityCode}-${warehouse.warehouseCode}`] = {
      name: warehouse.name,
    };
  });

  $: if (
    Object.keys(cityIdHash).length > 0 &&
    Object.keys(warehouseMap).length > 0 &&
    requestData
  ) {
    setDataSource(requestData);
  }
</script>

<div><b>Bag</b></div>
<div class="b-pd-2" />
<PanelContainer
  title="Bag Details"
  toolbarMenuItems={actions}
  panelSettings={columnSetting}
  panelContainerData={dataSource}
  {linkGenerator}
/>

<style>
  .padding {
    padding: 0px 10px;
  }
  .button {
    max-width: 150px;
    display: inline-block;
  }
  .display-flex {
    display: flex;
    flex-direction: row;
  }
  .flex-end {
    justify-content: flex-end;
    align-items: flex-end;
  }
  .grid-container {
    display: grid;
    grid-template-columns: auto auto auto auto;
    column-gap: 1rem;
  }
  .grid-container-top {
    display: grid;
    grid-template-columns: auto auto;
  }
  .full-width {
    width: 100%;
  }
  .b-pd-2 {
    padding-bottom: 2rem;
  }
  .justify-content {
    justify-content: space-between;
  }
  .grid-item {
    padding-bottom: 1rem;
  }
</style>
