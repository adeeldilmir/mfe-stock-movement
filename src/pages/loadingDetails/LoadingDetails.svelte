<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { PanelContainer } from "@swyft-logistics/styleguide";
  import { getPanelSetting, getLoad } from "./api";
  import { cities, warehouses, vehicles, drivers } from "../../store";

  export let progress: any;
  export let loadId: string = "";

  let dataSource: any = null;
  let limit;
  let skip;
  let columnSetting;
  let actions = [];
  let cityIdHash = {};
  let warehouseMap = {};
  let vehiclesMap = {};
  let driversMap = {};
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
    requestData = await getLoad(loadId);
    dispatch("hide-loader");
  });

  function getStops(routes: string[]) {
    const stops = routes.map((route) => {
      return cityIdHash[route] ? cityIdHash[route].code: "";
    });
    return  stops.join(",");
  }

  async function setDataSource(data) {
    actions = [];
    data.createdAt = new Date(data.createdAt).toLocaleDateString(
      "en-US",
      dateOptions
    );
    data.contentCount = data.manifestIds.length;
    data.originHub =
      warehouseMap[`${data.originCity}-${data.originWarehouse}`].name;
    data.originCity = `${cityIdHash[data.originCity].name}`;
    data.destinationCity = `${cityIdHash[data.destinationCity].name}`;
    data.driverName = driversMap[data.driverName];
    data.vehicleNumber = vehiclesMap[data.vehicleNumber];
    data.stops = getStops(data.route)

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
    return `/stock-movement/history/manifests/${text}`;
  }

  $: $cities.forEach((city) => {
    cityIdHash[city.cityCode] = {
      name: city.name,
      code: city.code,
    };
  });

  
  $: $vehicles.forEach((vehicle) => {
      vehiclesMap[vehicle.id] = vehicle.plateNumber;
    });
  $: $drivers.forEach((driver) => {
      driversMap[driver.id] = driver.name;
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

<div><b>Loading</b></div>
<div class="b-pd-2" />
<PanelContainer
  title="Loading Details"
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
