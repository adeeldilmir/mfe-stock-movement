<script lang="ts">
  import { Button, Tabs, Tab, Page } from "@swyft-logistics/styleguide";
  import {
    BaggingStatuses,
    ManifestStatuses,
    LoadingStatuses,
  } from "../../common/utils/enums";
  import { navigate } from "svelte-navigator";
  import HistoryTab from "./common/HistoryTab.svelte";
  import HistoryFilters from "./common/HistoryFilters.svelte";
  import { onMount, createEventDispatcher } from "svelte";
  import {
    getColumnsSettingBags,
    getColumnsSettingManifest,
    getColumnsSettingLoading,
   
    getAllBags,
    getAllManifest,
    getAllLoading,
    printManifest,
    getDetailsLabel,
    getBaggingLabel,
    getLoadingPrint,
    getFilteredBags,
    getFilteredManifest,
    getFilteredLoading,
  } from "./api";
  import { cities, warehouses, vehicles, drivers } from "../../store";
  import { toast } from "@zerodevx/svelte-toast";
  import { getUser, isEmpty } from "../../common/utils/utils";
  import type { ITableMetaData } from "../../common/interfaces/ITableMetadata";
  import type { IColumns } from "../../common/interfaces/IColumns";

  export let progress: any;
  let componentLoaded: boolean = false;
  let selected: string = "bags";
  let cityMap = {};
  let warehouseMap = {};
  let bagStatuses = Object.keys(BaggingStatuses).map((key) => {
    return BaggingStatuses[key];
  });
  let manifestStatuses = Object.keys(ManifestStatuses).map((key) => {
    return ManifestStatuses[key];
  });
  let loadingStatuses = Object.keys(LoadingStatuses).map((key) => {
    return LoadingStatuses[key];
  });
  let driversMap = {};
  let vehiclesMap = {};
  let filters;
  let cityDropdownNames;
  let driverDropdownNames;
  let originHubOptions;
  let dataSource = []; // TODO: Define interace
  let dataSourceManifest = [];
  let dataSourceLoading = [];
  let columnsBag: Array<IColumns>;
  let columnsManifest: Array<IColumns>;
  let columnsLoading: Array<IColumns>;
  let journeyType = "";
  let destinationCity = [];
  let dateFrom = "";
  let dateTo = "";
  let currentStatus = "";
  let driversSelected = [];
  let originHub = [];
  let minDate = "today";
  let destinationHub = [];
  let destinationCities = [];
  let destinationWarehouses = [];
  let originCities = [];
  let originWarehouses = [];
  let disabledFields: boolean = true;
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' , hour: '2-digit', minute: '2-digit', hour12: true, };
  let tableMetadata: ITableMetaData = {
    pageSize: 50,
        currentPage: 1,
        total: 0,
        isMultiline: false,
        rowMenuOptions: [],
        rowContextMenuOptions: [{ label: "Details", action: "viewRequestDetails" }],
  };
  let bagId: string = "";
  let manifestId: string = "";
  let tableMetadataManifest: ITableMetaData = {
    pageSize: 50,
        currentPage: 1,
        total: 0,
        isMultiline: false,
        rowMenuOptions: []
  };
  let tableMetadataLoading: ITableMetaData = {
    pageSize: 50,
        currentPage: 1,
        total: 0,
        isMultiline: false,
        rowMenuOptions: []
  };
  let loadingId: string = "";
  const dispatch = createEventDispatcher();

  onMount(async () => {
    let columnSetting = await getColumnsSettingBags();
    let columnSettingManifest = await getColumnsSettingManifest();
    let columnSettingLoading = await getColumnsSettingLoading();
    columnsBag = columnSetting.columns;
    columnsManifest = columnSettingManifest.columns;
    columnsLoading = columnSettingLoading.columns;
    tableMetadata = columnSetting.tableMetadata;
    tableMetadataManifest = columnSettingManifest.tableMetadata;
    tableMetadataLoading = columnSettingLoading.tableMetadata;
  });

  async function setDataSourceLoadings(loadings: {
    results: any[];
    count: number;
  }) {
    dispatch("show-loader");
    tableMetadataLoading.total = loadings.count;
    tableMetadataLoading = { ...tableMetadataLoading };
    let tempDataSource = [];
    loadings.results.forEach((load) => {
      tempDataSource.push({
        createdAt: new Date(load.createdAt).toLocaleDateString('en-US', dateOptions),
        id: load.loadingId,
        manifestCount: load.manifestIds.length,
        weight: load.weight,
        currentStatus: load.currentStatusId,
        currentStatusDate: setCurrentStatusDate(load.statusHistory, load.currentStatusId),
        stops: getStops(load.route),
        driverName: driversMap[load.driverName],
        vehicleNumber: vehiclesMap[load.vehicleNumber],
        originCity: cityMap[load.originCity]
          ? cityMap[load.originCity].name
          : "",
        originWarehouse:
          warehouseMap[`${load.originWarehouse}${load.originCity}`],
        destinationCity: cityMap[load.destinationCity]
          ? cityMap[load.destinationCity].name
          : "",
        destinationWarehouse:
          warehouseMap[`${load.destinationWarehouse}${load.destinationCity}`],

        rowSpecificButtons: [
          { label: "Document", action: "download-document" },
        ],
      });
    });
    dataSourceLoading = [...tempDataSource];
  }
  async function setDataSourceManifests(manifest: {
    results: any[];
    count: number;
  }) {
    dispatch("show-loader");
    tableMetadataManifest.total = manifest.count;
    tableMetadataManifest = { ...tableMetadataManifest };
    let tempDataSource = [];
    manifest.results.forEach((manifest) => {
      tempDataSource.push({
        createdAt: new Date(manifest.createdAt).toLocaleDateString('en-US', dateOptions),
        id: manifest.manifestId,
        bagCount: manifest.content.length,
        weight: manifest.weight,
        currentStatus: manifest.currentStatusId,
        currentStatusDate: setCurrentStatusDate(manifest.statusHistory, manifest.currentStatusId),
        productTypeCode: manifest.productTypeCode,
        journeyTypeCode: manifest.journeyTypeCode,
        serviceTypeCode: manifest.serviceTypeCode,
        originCity: cityMap[manifest.originCity]
          ? cityMap[manifest.originCity].name
          : "",
        originWarehouse:
          warehouseMap[`${manifest.originWarehouse}${manifest.originCity}`],
        destinationCity: cityMap[manifest.originCity]
          ? cityMap[manifest.destinationCity].name
          : "",
        rowSpecificButtons: [
          { label: "Document", action: "download-document" },
        ],
      });
    });
    dataSourceManifest = [...tempDataSource];
  }
  async function setDataSourceBags(bags: { results: any[]; count: number }) {
    
    tableMetadata.total = bags.count;
    tableMetadata = { ...tableMetadata };
    let tempDataSource = [];
    bags.results.forEach((bag) => {
      tempDataSource.push({
        createdAt: new Date(bag.createdAt).toLocaleDateString('en-US', dateOptions),
        id: bag.baggingId,
        parcelCount: bag.parcelIds.length,
        weight: bag.weight,
        currentStatus: bag.currentStatusId,
        currentStatusDate: setCurrentStatusDate(bag.statusHistory, bag.currentStatusId),
        productTypeCode: bag.productTypeCode,
        journeyTypeCode: bag.journeyTypeCode,
        serviceTypeCode: bag.serviceTypeCode,
        originCity: cityMap[bag.originCity] ? cityMap[bag.originCity].name : "",
        originWarehouse:
          warehouseMap[`${bag.originWarehouse}${bag.originCity}`],
        destinationCity: cityMap[bag.destinationCity]
          ? cityMap[bag.destinationCity].name
          : "",
        rowSpecificButtons1: [
          { label: "Document", action: "download-document" },
        ],
        rowSpecificButtons2: [{ label: "Label", action: "download-label" }],
      });
    });

    dataSource = [...tempDataSource];
  }
 function setCurrentStatusDate(statusHistory, currentStatus){
    let currentStatusDate = statusHistory.find((statusData) => {
      if (statusData.status === currentStatus) {
        return statusData ? statusData.createdAt : '';
      }

    });
    return currentStatus ? new Date(currentStatusDate.createdAt).toLocaleDateString('en-US', dateOptions) : '';
}
  async function downloadHandler(e) {
    try {
      let bagId = dataSource[e.detail.rowId].id;
      dataSource[e.detail.rowId].rowSpecificButtons1[0].label = "Downloading";

      const printRes = await getDetailsLabel(bagId);
      window.open(printRes.url);
      dataSource[e.detail.rowId].rowSpecificButtons1[0].label = "Document";
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  }
  async function getDoc(e) {
    try {
      let bagId = dataSource[e.detail.rowId].id;
      dataSource[e.detail.rowId].rowSpecificButtons2[0].label = "Downloading";

      const printRes = await getBaggingLabel(bagId);
      window.open(printRes.url);
      dataSource[e.detail.rowId].rowSpecificButtons2[0].label = "Label";
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  }
  async function downloadHandlerManifest(e) {
    try {
      let manifestId = dataSourceManifest[e.detail.rowId].id;
      dataSourceManifest[e.detail.rowId].rowSpecificButtons[0].label =
        "Downloading";

      const printRes = await printManifest(manifestId);
      window.open(printRes["url"]);
      dataSourceManifest[e.detail.rowId].rowSpecificButtons[0].label =
        "Document";
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  }
  async function downloadHandlerLoading(e) {
    try {
      let loadingId = dataSourceLoading[e.detail.rowId].id;
      dataSourceLoading[e.detail.rowId].rowSpecificButtons[0].label =
        "Downloading";

      const printRes = await getLoadingPrint(loadingId);
      window.open(printRes.url);
      dataSourceLoading[e.detail.rowId].rowSpecificButtons[0].label =
        "Document";
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  }
  async function handleBagContextMenuItemClick(e) {
    let { action, rowId } = e.detail;
    switch (action) {
      case "viewRequestDetails":
        viewBagRequestDetail(rowId);
        break;
      default:
        break;
    }
  }
  async function viewBagRequestDetail(rowId) {
    const selectedRow = dataSource[rowId];
    navigate(`/stock-movement/history/bags/${selectedRow.id}`);
  }

  async function handleManifestContextMenuItemClick(e) {
    let { action, rowId } = e.detail;
    switch (action) {
      case "viewRequestDetails":
        viewManifestRequestDetail(rowId);
        break;
      default:
        break;
    }
  }
  async function viewManifestRequestDetail(rowId) {
    const selectedRow = dataSourceManifest[rowId];
    navigate(`/stock-movement/history/manifests/${selectedRow.id}`);
  }

  async function handleLoadContextMenuItemClick(e) {
    let { action, rowId } = e.detail;
    switch (action) {
      case "viewRequestDetails":
      viewLoadRequestDetail(rowId);
        break;
      default:
        break;
    }
  }
  async function viewLoadRequestDetail(rowId) {
    const selectedRow = dataSourceLoading[rowId];
    navigate(`/stock-movement/history/loadings/${selectedRow.id}`);
  }

  async function pageChangedHandlerBags({ detail }) {
    try {
      dispatch("show-loader");
      let { limit, skip } = detail;
      const checkFilter = setFilters();
      if (!checkFilter) {
        searchByFilterHandler(limit, skip);
      } else {
        const bags = await getAllBags(limit, skip);
        if (bags.error) {
          throw new Error(bags.error);
        } else {
          bagId = "";
          dataSource = [];
          setDataSourceBags(bags);
        }
      }
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
    dispatch("hide-loader");
  }
  async function pageHandlerManifest({ detail }) {
    try {
      dispatch("show-loader");
      let { limit, skip } = detail;
      const checkFilter = setFilters();
      if (!checkFilter) {
        searchByFilterHandler(limit, skip);
      } else {
        const manifest = await getAllManifest(limit, skip);
        if (manifest.error) {
          throw new Error(manifest.error);
        } else {
          manifestId = "";
          dataSourceManifest = [];
          setDataSourceManifests(manifest);
        }
      }
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
    dispatch("hide-loader");
  }
  async function pageHandlerLoading({ detail }) {
    try {
      dispatch("show-loader");
      let { limit, skip } = detail;
      const checkFilter = setFilters();
      if (!checkFilter) {
        searchByFilterHandler(limit, skip);
      } else {
        const loadingData = await getAllLoading(limit, skip);
        if (loadingData.error) {
          throw new Error(loadingData.error);
        } else {
          dataSourceLoading = [];
          loadingId = "";
          setDataSourceLoadings(loadingData);
        }
      }
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
    dispatch("hide-loader");
  }
  function getStops(routes: string[]) {
    const stops = routes.map((route) => {
      return cityMap[route] ? cityMap[route].code: "";
    });
    return  stops.join(",") ;
  }
  async function applySearchHandler() {
    if (selected === "bags") {
      tableMetadata.currentPage = 1;
    } else if (selected === "manifest") {
      tableMetadataManifest.currentPage = 1;
    } else if (selected === "loading") {
      tableMetadataLoading.currentPage = 1;
    }
    searchByFilterHandler(50, 0);
  }
  async function searchByFilterHandler(
    limitFilter?: number,
    skipFilter?: number
  ) {
    try {
      dispatch("show-loader");

      const limit = limitFilter ? limitFilter : 50;
      const skip = skipFilter ? skipFilter : 0;
      const checkFilter = setFilters();
      if (checkFilter) {
        if (selected === "bags") {
          const bags = await getAllBags(limit, skip);
          if (bags.error) {
            throw new Error(bags.error);
          } else {
            dataSource = [];
            setDataSourceBags(bags);
          }
        } else if (selected === "manifest") {
          const manifest = await getAllManifest(limit, skip);
          if (manifest.error) {
            throw new Error(manifest.error);
          } else {
            dataSourceManifest = [];
            setDataSourceManifests(manifest);
          }
        } else if (selected === "loading") {
          const loadingData = await getAllLoading(limit, skip);
          if (loadingData.error) {
            throw new Error(loadingData.error);
          } else {
            dataSourceLoading = [];
            setDataSourceLoadings(loadingData);
          }
        }
      }
      if (selected === "bags") {
        try {
          const bags = await getFilteredBags(limit, skip, filters);
          if (bags.error) {
            searchByFilterHandler;
            throw new Error("Something went wrong");
          } else {
            setDataSourceBags(bags);
          }
        } catch (error) {
          dispatch("hide-loader");
          toast.push("Something went wrong", { classes: ["error"] });
        }
      } else if (selected === "manifest") {
        try {
          const manifest = await getFilteredManifest(limit, skip, filters);
          if (manifest.error) {
            throw new Error("Something went wrong");
          } else {
            setDataSourceManifests(manifest);
          }
        } catch (error) {
          dispatch("hide-loader");
          toast.push("Something went wrong", { classes: ["error"] });
        }
      } else if (selected === "loading") {
        try {
          const loadingData = await getFilteredLoading(limit, skip, filters);
          if (loadingData.error) {
            throw new Error("Something went wrong");
          } else {
            setDataSourceLoadings(loadingData);
          }
        } catch (error) {
          toast.push("Something went wrong", { classes: ["error"] });
        }
      }
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }

    dispatch("hide-loader");
  }
  function setFilters() {
    try {
      let from, to;
      if (selected === "bags") {
        manifestId = "";
        loadingId = "";
      } else if (selected === "manifest") {
        bagId = "";
        loadingId = "";
      } else if (selected === "loading") {
        bagId = "";
        manifestId = "";
      }
      if (originHub) {
        originCities = originHub.map((data) => {
          return data.cityCode;
        });
        originWarehouses = originHub.map((data) => {
          return data.warehouseCode;
        });
      } else {
        originCities = [];
        originWarehouses = [];
      }
      if (dateFrom !== "" || dateTo !== "") {
        if (dateFrom === "" || dateTo === "") {
          throw new Error("Please select both dates");
        } else {
          from = new Date(dateFrom);
          to = new Date(dateTo);
          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);
          from = from.toISOString();
          to = to.toISOString();
        }
      }
      if (destinationHub) {
        destinationCities = destinationHub.map((data) => {
          return data.cityCode;
        });
        destinationWarehouses = destinationHub.map((data) => {
          return data.warehouseCode;
        });
      } else {
        destinationCities = [];
        destinationWarehouses = [];
      }
      filters = {
        baggingId: bagId,
        manifestId: manifestId,
        loadingId: loadingId,
        createdAt: {
          $gte: dateFrom === "" ? "" : new Date(from).toISOString(),
          $lte: dateTo === "" ? "" : new Date(to).toISOString(),
        },
        journeyTypeCode: { $in: journeyType },
        destinationCity: {
          $in: selected !== "loading" ? destinationCity : destinationCities,
        },
        destinationWarehouse: { $in: destinationWarehouses },
        currentStatusId: currentStatus,
        driverName: { $in: driversSelected },
        originCity: { $in: originCities },
        originWarehouse: { $in: originWarehouses },
      };
      if (bagId === "") {
        delete filters.baggingId;
      }
      if (manifestId === "") {
        delete filters.manifestId;
      }
      if (loadingId === "") {
        delete filters.loadingId;
      }
      if (dateFrom === "") {
        delete filters.createdAt;
      }
      if (journeyType === "") {
        delete filters.journeyTypeCode;
      }
      if (selected === "loading") {
        if (destinationCities.length === 0) {
          delete filters.destinationCity;
        }
      } else {
        delete filters.destinationWarehouse;
        if (destinationCity.length === 0) {
          delete filters.destinationCity;
        }
      }

      if (destinationWarehouses.length === 0) {
        delete filters.destinationWarehouse;
      }
      if (currentStatus === "") {
        delete filters.currentStatusId;
      }
      if (driversSelected.length === 0) {
        delete filters.driverName;
      }
      if (originCities.length === 0) {
        delete filters.originCity;
      }
      if (originWarehouses.length === 0) {
        delete filters.originWarehouse;
      }
      if (
        journeyType === "" &&
        destinationCity.length === 0 &&
        currentStatus === "" &&
        driversSelected.length === 0 &&
        originCities.length === 0 &&
        destinationCities.length === 0 &&
        destinationWarehouses.length === 0 &&
        originWarehouses.length === 0 &&
        dateFrom === "" &&
        bagId === "" &&
        manifestId === "" &&
        loadingId === ""
      ) {
        filters = {};
        return true;
      }

      return false;
    } catch (error) {
      console.log(error);
      toast.push(error.message, { classes: ["error"] });
    }
  }
  async function clearFiltersHandler() {
    dispatch("show-loader");
    resetFilters();
    searchByFilterHandler(50, 0);
  }
  function resetFilters() {
    journeyType = "";
    destinationCity = [];
    originHub = [];
    destinationHub = [];
    driversSelected = [];
    currentStatus = "";
    destinationCities = [];
    destinationWarehouses = [];
    dateFrom = "";
    dateTo = "";
    bagId = "";
    manifestId = "";
    loadingId = "";
  }
  $: if (dateFrom) {
    minDate = dateFrom;
  }
  $: {
    $cities.forEach((city) => {
      cityMap[city.cityCode] = { name: city.name, code: city.code };
    });
    cityDropdownNames = $cities.map((data) => ({
      id: data.cityCode,
      name: data.cityCode + "-" + data.code,
    }));
    driverDropdownNames = $drivers.map((data) => ({
      id: data.id,
      name: data.name,
    }));
    $warehouses.forEach((warehouse) => {
      warehouseMap[`${warehouse.warehouseCode}${warehouse.cityCode}`] =
        warehouse.name;
    });
    $vehicles.forEach((vehicle) => {
      vehiclesMap[vehicle.id] = vehicle.plateNumber;
    });
    $drivers.forEach((driver) => {
      driversMap[driver.id] = driver.name;
    });
    originHubOptions = $warehouses.map((data) => ({
      cityCode: data.cityCode,
      warehouseCode: data.warehouseCode,
      name: data.cityCode + "-" + data.name,
    }));
    if (!isEmpty(cityMap) && !isEmpty(warehouseMap) && !isEmpty(vehiclesMap)) {
      componentLoaded = true;
      disabledFields = false;
    }
  }

  $: if (selected) {
    if (componentLoaded) {
      searchByFilterHandler(50, 0);
    }
  }
</script>
<div>History</div>
<div class="container">
  <div>
    <Tabs bind:selected>
      <div slot="tabs">
        <Tab class="tab" name="bags" title="Bags" {selected} />
        <Tab class="tab" name="manifest" title="Manifest" {selected} />
        <Tab class="tab" name="loading" title="Loading" {selected} />
      </div>
    </Tabs>
    <div>
      <Page id="bags" name="bags" {selected}>
        <HistoryTab
          columns={columnsBag}
          {dataSource}
          {tableMetadata}
          downloadDocumentHandler={downloadHandler}
          getLabelHandler={getDoc}
          pageChangedHandler={pageChangedHandlerBags}
          handleContextMenuItemClick={handleBagContextMenuItemClick}
        >
          <div slot="filters">
          
              <HistoryFilters
                filterName="Filters:"
                bind:journeyType
                bind:destinationCity
                bind:currentStatus
                bind:driversSelected
                bind:originHub
                bind:destinationHub
                bind:itemsDestinationCity={cityDropdownNames}
                bind:itemsOriginHub={originHubOptions}
                bind:itemsCurrentStatus={bagStatuses}
                {disabledFields}
                showDrivers={false}
                searchHandler={applySearchHandler}
                clearHandler={clearFiltersHandler}
                searchButtonTestId="search-bag"
                bind:dateFrom
                bind:dateTo
                bind:minDate={dateFrom}
                showDestinationHub={false}
                bind:entityId={bagId}
                inputLabel="Bag Number:"
                inputPlaceholder="Enter Bag Number"
              />
        
          </div>
        </HistoryTab>
      </Page>

      <Page id="manifest" name="manifest" {selected}>
        <HistoryTab
          columns={columnsManifest}
          dataSource={dataSourceManifest}
          tableMetadata={tableMetadataManifest}
          downloadDocumentHandler={downloadHandlerManifest}
          pageChangedHandler={pageHandlerManifest}
          handleContextMenuItemClick={handleManifestContextMenuItemClick}
        >
          <div slot="filters">
        
              <HistoryFilters
                filterName="Filters:"
                bind:journeyType
                bind:destinationCity
                bind:currentStatus
                bind:driversSelected
                bind:originHub
                bind:destinationHub
                bind:itemsDestinationCity={cityDropdownNames}
                bind:itemsOriginHub={originHubOptions}
                bind:itemsCurrentStatus={manifestStatuses}
                {disabledFields}
                showDrivers={false}
                searchHandler={applySearchHandler}
                clearHandler={clearFiltersHandler}
                searchButtonTestId="search-manifest"
                bind:dateFrom
                bind:dateTo
                bind:minDate
                showDestinationHub={false}
                bind:entityId={manifestId}
                inputLabel="Manifest Number:"
                inputPlaceholder="Enter Manifest Number"
              />
         
          </div>
        </HistoryTab>
      </Page>
      <Page id="loading" name="loading" {selected}>
        <HistoryTab
          columns={columnsLoading}
          dataSource={dataSourceLoading}
          tableMetadata={tableMetadataLoading}
          downloadDocumentHandler={downloadHandlerLoading}
          pageChangedHandler={pageHandlerLoading}
          handleContextMenuItemClick={handleLoadContextMenuItemClick}
        >
          <div slot="filters">
           
              <HistoryFilters
                filterName="Filters:"
                bind:journeyType
                bind:destinationCity
                bind:currentStatus
                bind:driversSelected
                bind:originHub
                bind:destinationHub
                bind:itemsDestinationCity={cityDropdownNames}
                bind:itemsOriginHub={originHubOptions}
                bind:itemsCurrentStatus={loadingStatuses}
                {disabledFields}
                showDrivers={true}
                itemsDriver={$drivers.map((data) => ({
                  id: data.id,
                  name: data.name,
                }))}
                searchHandler={applySearchHandler}
                clearHandler={clearFiltersHandler}
                searchButtonTestId="search-loading"
                bind:dateFrom
                bind:dateTo
                bind:minDate={dateFrom}
                showDestinationHub={true}
                showJourney={false}
                bind:entityId={loadingId}
                inputLabel="Loading Number:"
                inputPlaceholder="Enter Loading Number"
              />

          </div>
        </HistoryTab>
      </Page>
    </div>
  </div>
</div>

<style>
  .grid-container {
    display: grid;
    justify-content: flex-end;
  }
  .filter-button {
    max-width: 150px;
    margin-bottom: 20px;
  }
</style>
