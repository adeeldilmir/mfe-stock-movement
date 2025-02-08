<script lang="ts">
  import {
    Grid,
    Dropdown,
    Input,
    Button,
    Dialog,
    AutoComplete,    
    Message
  } from "@swyft-logistics/styleguide";
  import { onMount, createEventDispatcher } from "svelte";
  import cities from "../../store/cities";
  import vehicles from "../../store/vehicles";
  import warehouses from "../../store/warehouse";
  import { toast } from "@zerodevx/svelte-toast";
  import {
    createLoading,
    getColumnsSetting,
    getDrivers,
    getManifest,
    getWarehouse,
    getWarehouseByCity,
    loadingDetails,
    getVehicleCode,
    getVehicleDuplicateCheck,
  } from "./api";
  import type { IColumns } from "../../common/interfaces/IColumns";
  import type { ITableMetaData } from "../../common/interfaces/ITableMetadata";
  import {
    checkDuplicateScanEntry,
    getUser,
    isEqual,
    isExists,
    removeDuplicateItemsById,
  } from "../../common/utils/utils";
  import {
    LoadingStatuses,
    LabelPrefixes,
    ManifestStatuses,
  } from "../../common/utils/enums";

  export let progress;
  let routes = [];
  let dataSource = [];
  let totalWeight: number = 0;
  let destinationWarehouses = [];
  let drivers = [];
  let dialog;
  let wrapper;
  let columns: Array<IColumns>;
  let tableMetadata: ITableMetaData;
  let dialogError: any;
  let dialogContent: string;
  let userData = getUser();
  let vehicle: string;
  let originCity: string;
  let manifestId: string;
  let driverName: string;
  let vehicleSeal: string;
  let currentUser: string;
  let currentUserId: string;
  let currentUserEmail : string;
  let originCityCode: string;
  let destinationCity: string;
  let originWareHouse: string;
  let destinationWarehouse: string;
  let originCityDisplayName: string;
  let originWarehouseDisplayName: string;
  let destinationCityDisplayValue: string;
  let inputManifest = null;
  const dispatch = createEventDispatcher();

  onMount(async () => {
    let columnSetting = await getColumnsSetting();
    columns = columnSetting.columns;
    tableMetadata = columnSetting.tableMetadata;

    currentUser = `${getUser().user.firstName} ${getUser().user.lastName}`;
    currentUserId = getUser().userId;
    currentUserEmail = getUser().user.email;
    
    drivers = await getDrivers();
    const location = getUser().user.location;
    try {
      const filter = {
        where: {
          and: [
            {
              cityCode: location.cityCode,
            },
            {
              warehouseCode: location.warehouseCode,
            },
          ],
        },
      };
      const warehouseLocation = await getWarehouse(filter);
      originWareHouse = warehouseLocation[0].warehouseCode;
      originWarehouseDisplayName = `${warehouseLocation[0].warehouseCode}-${warehouseLocation[0].name}`;
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  });

  async function handleLoadingInput(e: string) {
    if (e.length !== 12 && e.substring(0, 3) !== "VHI") {
      if (
        !isEqual(e.substring(0, 1), LabelPrefixes.VEHICLES) &&
        !isEqual(e.length, 9)
      ) {
        dialogContent = "Error Occured";
        dialogError = "Invalid Loading ID Entered";
        dialog.toggle();
        toast.push("Invalid Loading Id Entered", { classes: ["error"] });
        vehicleSeal = "";
      } else if (
        (isEqual(e.length, 9) || isEqual(e.length, 8)) &&
        !isEqual(e.substring(0, 1), LabelPrefixes.VEHICLES)
      ) {
        dialogContent = "Error Occured";
        dialogError = "Invalid Loading ID Entered";
        dialog.toggle();
        toast.push("Invalid Loading Id Entered", { classes: ["error"] });
        vehicleSeal = "";
      } else if (
        (isEqual(e.length, 9) || isEqual(e.length, 8)) &&
        isEqual(e.substring(0, 1), LabelPrefixes.VEHICLES)
      ) {
        let code = await getVehicleCode(e);

        if (code.error) {
          dialogContent = "Error Occured";
          dialogError = "Seal number does not exists";
          dialog.toggle();
          toast.push("Seal number does not exists", { classes: ["error"] });
          vehicleSeal = "";
          return;
        }
        let duplicateCheck = await getVehicleDuplicateCheck(e);
        console.log(duplicateCheck);
        if (duplicateCheck.status === 404) {
          inputManifest.focus();
          toast.push(`Loading ID-${e} scanned`, {
            classes: ["success"],
            duration: 500,
          });
        } else if (
          duplicateCheck !== null ||
          Object.keys(duplicateCheck).length === 0
        ) {
          dialogContent = "Error Occured";
          dialogError = "Duplicate vehicle ID entered";
          dialog.toggle();
          toast.push("Duplicate vehicle ID entered", { classes: ["error"] });
          vehicleSeal = "";
        }
      } else {
        
        dialogContent = "Error Occured";
        dialogError = "Invalid Loading ID Entered";
        dialog.toggle();
        toast.push("Invalid Loading Id Entered", { classes: ["error"] });
        vehicleSeal = "";
      }
    } else if (isEqual(e.length, 12) && isEqual(e.substring(0, 3), "VHI")) {
   
      let code = await getVehicleCode(e);
      if (code.error) {
        dialogContent = "Error Occured";
        dialogError = "Seal number does not exists";
        dialog.toggle();
        toast.push("Seal number does not exists", { classes: ["error"] });
        vehicleSeal = "";
        return;
      }
      let duplicateCheck = await getVehicleDuplicateCheck(e);
      if (duplicateCheck.status == 404) {
        inputManifest.focus();
        toast.push(`Loading ID-${e} scanned`, {
          classes: ["success"],
          duration: 500,
        });
      } else if (
        duplicateCheck !== null ||
        Object.keys(duplicateCheck).length === 0
      ) {
        dialogContent = "Error Occured";
        dialogError = "Duplicate vehicle ID entered";
        dialog.toggle();
        toast.push("Duplicate vehicle ID entered", { classes: ["error"] });
        vehicleSeal = "";
      }
    } else {
      
      dialogContent = "Error Occured";
      dialogError = "Invalid Loading ID Entered";
      dialog.toggle();
      toast.push("Invalid Loading Id Entered", { classes: ["error"] });
      vehicleSeal = "";
    }
  }

  async function handleDestinationSelection(e) {
    let id = e;
    if (id) {
      try {
        const destinationHub = await getWarehouseByCity(id);
        if (!isExists(destinationHub)) {
          dialogContent = "Error Occured";
          dialogError = "No warehouse exists in selected city";
          dialog.toggle();
          toast.push("No warehouse exists in selected city", {
            classes: ["error"],
          });
        }
        if (destinationHub.error) {
          throw new Error(destinationHub.error);
        }
        destinationWarehouse = "";
        destinationWarehouses = destinationHub;
      } catch (error) {
        dialogContent = "Error Occured";
        dialogError = "Something went wrong";
        dialog.toggle();
        toast.push("Something went wrong", { classes: ["error"] });
      }
    } else {
      destinationWarehouses = [];
    }
  }

  function handleDestinationCity(e) {
    if (e.length === 0) {
      destinationCity = "";
      destinationCityDisplayValue = "";
      destinationWarehouses = [];
    } else {
      let warehouseCity = $warehouses.find((data) => data.cityCode === e[0]);
      destinationWarehouses = [];
      if (warehouseCity) {
        let warehouseCityId = warehouseCity.cityId;
        let warehouseCityCode = warehouseCity.cityCode;
        destinationCity = $cities.find(
          (data) => data.cityCode === warehouseCityCode
        ).cityCode;
        destinationCityDisplayValue = `${
          $cities.find((data) => data.cityCode === warehouseCityCode).cityCode
        }-${$cities.find((data) => data.cityCode === warehouseCityCode).name}`;
        handleDestinationSelection(warehouseCityId);
      } else {
        destinationWarehouses = [];
      }
    }
  }

  async function handleManifestInput(e) {
    let id = e;
    if (id) {
      if (id.length !== 12 || id.substring(0, 3) !== "MAN") {
        dialogContent = "Error Occured";
        dialogError = "Invalid Manifest Id Entered";
        dialog.toggle();
        toast.push("Invalid Manifest Id Entered", { classes: ["error"] });
        manifestId = "";
        return;
      }
      id = id.trim();
      if (checkDuplicateScanEntry(dataSource, id)) {
        dialogContent = "Error Occured";
        dialogError = "Item Already Scan";
        dialog.toggle();
        manifestId = "";
        toast.push("Item Already Scan", { classes: ["error"] });
      } else {
        try {
          dispatch("show-loader");
          const manifestRes = await getManifest(id);
          if (manifestRes.error) {
            throw new Error(manifestRes.error);
          }
          if (
            isEqual(manifestRes.currentStatusId, ManifestStatuses.NEW) ||
            isEqual(manifestRes.currentStatusId, ManifestStatuses.UNLOADED)
          ) {
            if (routes.includes(manifestRes.destinationCity)) {
              if (isEqual(manifestRes.currentStatusId, ManifestStatuses.NEW)) {
                if (
                  manifestRes.originCity != getUser().user.location.cityCode ||
                  manifestRes.originWarehouse !=
                    getUser().user.location.warehouseCode
                ) {
                  dialogContent = "Error Occured";
                  dialogError = `${manifestRes.manifestId} cannot be loaded at this location`;
                  dialog.toggle();
                  manifestId = "";
                  dispatch("hide-loader");
                  return;
                }
              } else if (
                isEqual(manifestRes.currentStatusId, ManifestStatuses.UNLOADED)
              ) {
                if (
                  manifestRes.statusHistory[
                      manifestRes.statusHistory.length - 1
                    ].destinationWarehouse&&(getUser().user.location.cityCode !=
                    manifestRes.statusHistory[
                      manifestRes.statusHistory.length - 1
                    ].destinationCity||
                  getUser().user.location.warehouseCode !=
                    manifestRes.statusHistory[
                      manifestRes.statusHistory.length - 1
                    ].destinationWarehouse)
                ) {
                  dialogContent = "Error Occured";
                  dialogError = `${manifestRes.manifestId} cannot be loaded at this location`;
                  dialog.toggle();
                  manifestId = "";
                  dispatch("hide-loader");
                  return;
                }
              }
              let newObj = [
                {
                  id: manifestRes.manifestId,
                  pieces: manifestRes.content.length,
                  weight: manifestRes.weight,
                  city: $cities.find(
                    (data) => data.cityCode === manifestRes.destinationCity
                  ).name,
                  rowSpecificButtons: [
                    { label: "Remove", action: "remove-handler" },
                  ],
                },
              ];
              dataSource = newObj.concat(dataSource);
              dataSource = removeDuplicateItemsById(dataSource);       
              totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
              totalWeight = parseFloat((totalWeight).toFixed(3));
    
              toast.push(`Manifest ID-${manifestRes.manifestId} scanned`, {
                classes: ["success"],
                duration: 500,
              });
              dispatch("hide-loader");
              manifestId = "";
            } else {
              dialogContent = "Error Occured";
              dialogError = "Manifest city does not exists in routes";
              dialog.toggle();
              toast.push("Manifest city does not exists in routes", {
                classes: ["error"],
              });
              manifestId = "";
              dispatch("hide-loader");
            }
          } else {
            dialogContent = "Error Occured";
            dialogError = "Current status of Manifest is not New/Unloaded";
            dialog.toggle();
            toast.push("Current status of Manifest is not New/Unloaded", {
              classes: ["error"],
            });
            dispatch("hide-loader");
            manifestId = "";
          }
        } catch (error) {
          dialogContent = "Error Occured";
          dialogError = "Something went wrong";
          dialog.toggle();
          toast.push("Something went wrong", { classes: ["error"] });
          dispatch("hide-loader");
        }
      }
    }
  }

  async function onFormSubmit(e) {
    e.preventDefault();
    let payload = {
      manifestIds: dataSource.map((data) => data.id),
      originCity: originCityCode,
      originWarehouse: originWareHouse,
      destinationCity: destinationCity,
      destinationWarehouse: destinationWarehouse,
      source: currentUser,
      sourceId: currentUserId,
      weight: totalWeight,
      driverName: driverName,
      vehicleNumber: vehicle,
      route: Array.isArray(routes) ? routes : [routes],
      loadingId: vehicleSeal,
      currentStatusId: LoadingStatuses.NEW,
      statusHistory: [
        {
          status: LoadingStatuses.NEW,
          originCity: originCityCode,
          originWarehouse: originWareHouse,
          destinationCity: destinationCity,
          destinationWarehouse: destinationWarehouse,
          creator:"admin",
          createdBy:currentUserEmail
        },
      ],
    };
    try {
      dispatch("show-loader");
      let data = await createLoading(payload);
     
      if (data.error) {
        throw new Error(data.error);
      }
     
      if (isExists(data)) {
        let loadingDetailDoc = await loadingDetails(data.loadingId);
        window.open(loadingDetailDoc.url);
        toast.push("Loading created", { classes: ["success"] });
        dispatch("hide-loader");
      }
      refresh();
    } catch (error) {
      dialogContent = "Error Occured";
      dialogError = error.message;
      dialog.toggle();
      dispatch("hide-loader");
    }
  }

  function removeHandler(e) {
    const deletedRow = dataSource.splice(e.detail.rowId, 1);
    dataSource = [...dataSource];
    totalWeight = parseFloat((totalWeight - deletedRow[0].weight).toFixed(3));
  }

  function refresh() {
    manifestId = "";
    dataSource = [];
    totalWeight = 0;
    vehicleSeal = "";
  }

  function exit() {
    dataSource = [];
    routes = [];
    manifestId = "";
    destinationCityDisplayValue = "";
    totalWeight = 0;
    vehicle = "";
    vehicleSeal = "";
    driverName = "";
    destinationWarehouses = [];
    destinationWarehouse = "";
  }

  $: $cities.forEach((city) => {
    if (city["cityCode"] == getUser().user.location.cityCode) {
      originCityCode = city["cityCode"];
      originCityDisplayName = `${city.cityCode}-${city.name}`;
      originCity = city.id;
    }
  });
</script>

<div>Loading</div>
<div style="--modal-body-max-height:300px;">
  <Dialog bind:this={dialog} header={dialogContent}>
    <div slot="dialog-content" class="full-width">
        {#if dialogError} 
          {#each dialogError.split(",") as error}
            <Message message={error} type="error" open={true} />
          {/each}
        {/if}
    </div>
  </Dialog>
</div>
<div class="container" bind:this={wrapper}>
  <form on:submit={onFormSubmit}>
    <div class="row-container filter-container">
      <div class="column-container">
        <div class="grid-container">
          <div class="grid-item span-column">
            <AutoComplete
              bind:value={routes}
              on:value-changed={(e) => handleDestinationCity(e.detail.value)}
              multiple={true}
              orderableSelection={true}
              label="Route"
              displayProperty="name"
              valueProperty="id"
              placeholder="Select City"
              items={$cities.map((data) => ({
                id: data.cityCode,
                name: data.code,
              }))}
              disabled={dataSource.length > 0}
              required
            />
          </div>
        </div>
        <div class="grid-container">
          <div class="grid-item">
            <Input
              bind:value={destinationCityDisplayValue}
              label="Destination City"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              bind:value={destinationWarehouse}
              label="Destination Hub"
              displayProperty="name"
              valueProperty="id"
              placeholder="Select Hub"
              items={destinationWarehouses.map((data) => ({
                id: data.warehouseCode,
                name: `${data.name}-${data.warehouseCode}`,
              }))}
              required
            />
          </div>
        </div>
        <div class="grid-container">
          <div class="grid-item">
            <Input
              bind:value={userData.user.firstName}
              label="User"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={originCityDisplayName}
              label="Origin City"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={originWarehouseDisplayName}
              label="Origin Hub"
              readonly
              disabled
              required
            />
          </div>
        </div>
        <div class="grid-container">
          <div class="grid-item">
            <AutoComplete
              bind:value={driverName}
              label="Driver Name"
              displayProperty="name"
              valueProperty="id"
              multiple={false}
              placeholder="Driver"
              items={drivers.map((data) => ({
                id: data.id,
                name: `${data.firstName} ${data.lastName}`,
              }))}
              required
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              bind:value={vehicle}
              label="Vehicle"
              displayProperty="plateNumber"
              valueProperty="id"
              multiple={false}
              placeholder="Vehicle"
              items={$vehicles
                .map((data) => {
                  
                  if (data.vehicleType.name != "Bike" ) {
                    if(data.vehicleType.name != "Bike FL (Rs.30)"){
                      return {
                      id: data.id,
                      plateNumber: `${data.plateNumber}-${data.vehicleType.name}`,
                    };
                    }
                  }
                })
                .filter((item) => !!item)}
              required
            />
          </div>          
        </div>
        <div class="grid-container">
          <div class="row-container grid-item">
            <div class="grid-container">
              <div class="grid-item">
                <div class="buttons">
                  <Button
                    label="Submit"
                    type="submit"
                    disabled={dataSource.length === 0}
                  />
                </div>
              </div>
              <div class="grid-item">
                <div class="buttons">
                  <Button label="Clear" on:click={refresh} />
                </div>
              </div>
              <div class="grid-item">
                <div class="buttons">
                  <Button label="Exit" on:click={exit} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>   
      <div class="grid-container">
        <div class="grid-item">
          <div class="card">
            <p><i class="fa fa-user" /></p>
            <h3 class="ft-large">{dataSource.length}</h3>
            <p class="ft-bold">Total Scanned</p>
          </div>          
        </div>

        <div class="grid-item">          
          <div class="card">
            <p><i class="fa fa-user" /></p>
            <h3 class="ft-large">{totalWeight}</h3>
            <p class="ft-bold">Total Weight(KG)</p>
          </div>
        </div>
      </div>              
    </div>

  </form>

  <div class="grid-container">
    <div class="grid-item">
      <Input
        bind:value={vehicleSeal}
        on:change={(e) => handleLoadingInput(e.target.value)}
        label="Vehicle Seal #"
      />
    </div>
    <div class="grid-item">
      <Input
        id="manifest"
        bind:value={manifestId}
        on:change={(e) => handleManifestInput(e.target.value)}
        bind:this={inputManifest}
        label="Manifest #"
        disabled={vehicleSeal?.length === 12 ||
        vehicleSeal?.length === 9 ||
        vehicleSeal?.length === 8
          ? false
          : true || (vehicleSeal?.length === 0 && routes.length > 0)}
      />
    </div>
  </div>

  <div class="b-pd-2" />
  <Grid
    {columns}
    {dataSource}
    {tableMetadata}
    on:remove-handler={removeHandler}
  />
</div>

<style>
  .buttons {
    max-width: 120px;
    padding-right: 1rem;
  }

  .row-container {
    display: flex;
    flex-direction: row;
  }
  .ft-large {
    font-size: 6rem;
    margin: 0;
    padding:0;
  }
  .ft-bold {
    font-weight: bold;
  }
  .column-container {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .filter-container {
    padding: 1rem 1rem 0 1rem;
    border: 1px solid #dddddd;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
  }
   
  .card {
    padding-left: 6rem;
    justify-content: center;
    display: flex;
    flex-direction: column;
    text-align: center;  
  } 
  .display-flex {
    display: flex;
    flex-direction: row;
  }

  .jt-sb {
    justify-content: space-between;
  }

  .flex-end {
    justify-content: flex-end;
    align-items: flex-end;
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

  .span-column {
    grid-column-start: 1;
    grid-column-end: 5;
  }

  .full-width {
    width: 100%;
  }
  :global(.log.info) {
    --toastBackground: green;
  }
  :global(.log.warn) {
    --toastBackground: red;
  }
</style>
