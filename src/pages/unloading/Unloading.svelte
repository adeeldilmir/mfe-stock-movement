<script lang="ts">
  import {
    Grid,
    Dropdown,
    Input,
    Button,
    SpinnerPage,
    Dialog,
    Message,
  } from "@swyft-logistics/styleguide";
  import { onMount, createEventDispatcher } from "svelte";
  import { vehicles, warehouses, cities, drivers } from "../../store";
  import { toast } from "@zerodevx/svelte-toast";
  import {
    getColumnsSetting,
    getLoading,
    getManifest,
    getWarehouse,
    updateLoadingStatus,
  } from "./api";
  import type { IColumns } from "../../common/interfaces/IColumns";
  import type { ITableMetaData } from "../../common/interfaces/ITableMetadata";
  import { getUser, isEqual } from "../../common/utils/utils";
  import type { ICity } from "../../common/interfaces/ICity";
  import { LoadingStatuses, LabelPrefixes } from "../../common/utils/enums";
  import type { IWarehouseLocation } from "../../common/interfaces/IWarehouseLocation";

  export let progress;
  let dataSource = [];
  let routes = [];
  let totalWeight: number = 0;
  let columns: Array<IColumns>;
  let tableMetadata: ITableMetaData;
  let userData = getUser();
  let vehicle: string;
  let loadingData: any;
  let createdBy: string;
  let originCity: string;
  let userOrigin: string;
  let driverName: string;
  let vehicleSeal: string;
  let userWarehouse: string;
  let destinationCity: string;
  let originWareHouse: string;
  let destinationWarehouse: string;
  let originCityDisplayName: string;
  let originWarehouseDisplayName: string;
  let submitedDisabled: boolean = false;
  let currentUserEmail : string;
  const dispatch = createEventDispatcher();

  onMount(async () => {
    let columnSetting = await getColumnsSetting();
    columns = columnSetting.columns;
    tableMetadata = columnSetting.tableMetadata;
    const location = getUser().user.location;
    currentUserEmail = getUser().user.email; 
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
      originWareHouse = warehouseLocation[0].id;
      userWarehouse = `${warehouseLocation[0].warehouseCode}-${warehouseLocation[0].name}`;
    } catch (error) {
      console.log(error);
      toast.push("Something went wrong", { classes: ["error"] });
    }
  });

  async function handleLoadingInput(loadingId: string) {
    if (
      !isEqual(loadingId.length, 12) ||
      !isEqual(loadingId.substring(0, 3), "VHI")
    ) {
      if (!isEqual(loadingId.substring(0,1) , LabelPrefixes.VEHICLES) || !isEqual(loadingId.length, 9) ){
        if (!isEqual(loadingId.substring(0,1) , LabelPrefixes.VEHICLES) || !isEqual(loadingId.length, 8) ){
        toast.push("Invalid Loading Id Entered", { classes: ["error"] });
      vehicleSeal = "";
      return;
      }
      }


    } 
    
    if (loadingId) {
      loadingId = loadingId.trim();
      vehicleSeal = "";
      try {
        dispatch("show-loader");
        loadingData = await getLoading(loadingId);
        if (loadingData.error) {
         if(loadingData.error === 'Loading not found') {
          toast.push("Invalid Loading Id Entered", { classes: ["error"] });
          dispatch("hide-loader");
          return;
         } else {
          throw new Error(loadingData.error);
         }
        }
        if (
          isEqual(
            loadingData.destinationCity,
            userData.user.location.cityCode
          ) &&
          isEqual(
            loadingData.destinationWarehouse,
            userData.user.location.warehouseCode
          )
        ) {
          if (isEqual(loadingData.currentStatusId, "New")) {
            let manifests = await Promise.all(
              loadingData.manifestIds.map(async (data) => {
                return await getManifest(data);
              })
            );
            dataSource = [
              ...dataSource,
              ...manifests.map((data) => ({
                id: data.manifestId,
                pieces: data.content.length,
                weight: data.weight,
              })),
            ];
            totalWeight = loadingData.weight;
            createdBy = loadingData.source;
            driverName = `${
              $drivers.find(
                (data) => data.id.toString() === loadingData.driverName
              ).name
            }`;
            originCityDisplayName = `${
              $cities.find((val) => val.cityCode === loadingData.originCity)
                .cityCode
            }-${
              $cities.find((val) => val.cityCode === loadingData.originCity)
                .code
            }`;
            originWarehouseDisplayName = `${
              $warehouses.find(
                (data: IWarehouseLocation) =>
                  data.warehouseCode === loadingData.originWarehouse &&
                  data.cityCode === loadingData.originCity
              ).warehouseCode
            }-${
              $warehouses.find(
                (data: IWarehouseLocation) =>
                  data.warehouseCode === loadingData.originWarehouse &&
                  data.cityCode === loadingData.originCity
              ).name
            }`;
            routes = loadingData.route.map(
              (data) =>
                `${$cities.find((val) => val.cityCode === data).cityCode}-${
                  $cities.find((val) => val.cityCode === data).code
                }`
            );
            originCityDisplayName = `${
              $cities.find((val) => val.cityCode === loadingData.originCity)
                .cityCode
            }-${
              $cities.find((val) => val.cityCode === loadingData.originCity)
                .name
            }`;
            createdBy = loadingData.source;
            destinationCity = `${
              $cities.find(
                (data: ICity) => data.cityCode === loadingData.destinationCity
              ).name
            }`;
            destinationWarehouse = `${
              $warehouses.find(
                (data) =>
                  data.warehouseCode === loadingData.destinationWarehouse &&
                  data.cityCode === loadingData.destinationCity
              ).name
            }`;
            vehicle = `${
              $vehicles.find((data) => data.id === loadingData.vehicleNumber)
                .plateNumber
            }`;
            dispatch("hide-loader");
          } else {
            toast.push("Vehicle hasn't Loaded yet", { classes: ["error"] });
            dispatch("hide-loader");
          }
        } else {
          toast.push(
            "Vehicle hasn't arrived at the destination city/warehouse",
            {
              classes: ["error"],
            }
          );
          dispatch("hide-loader");
        }
      } catch (error) {
        console.log(error);
        toast.push(error, { classes: ["error"] });
        dispatch("hide-loader");
      }
    }
  }

  async function onFormSubmit(e) {
    e.preventDefault();
    if (isEqual(loadingData.destinationCity, userData.user.location.cityCode)) {
      const data = {
        previousStatusId: loadingData.previousStatusId,
        currentStatusId: LoadingStatuses.CLOSED,
        meta: {
          status: LoadingStatuses.CLOSED,
          originCity: loadingData.originCity,
          originWarehouse: loadingData.originWarehouse,
          destinationCity: loadingData.destinationCity,
          createdBy: currentUserEmail ,
          creator:"admin",
          location: {
            cityCode: getUser().user.location.cityCode,
            warehouseCode: getUser().user.location.warehouseCode,
          },
        },
      };
      submitedDisabled = true;
      await updateLoadingStatus(loadingData.loadingId, data);

      toast.push("Unloading Successful", { classes: ["success"] });
      dataSource = [];
      vehicleSeal = "";
    } else {
      toast.push(
        "Cannot unload as vehicle is not at the desired destination city",
        { classes: ["success"] }
      );
    }
  }

  function exit() {
    dataSource = [];
    vehicleSeal = "";
    vehicle = "";
    createdBy = "";
    routes = [];
    totalWeight = 0;
    destinationCity = "";
    destinationWarehouse = "";
    originCityDisplayName = "";
    originWarehouseDisplayName = "";
    originCity = "";
    originWareHouse = "";
    driverName = "";
    submitedDisabled = false;
  }

  $: $cities.forEach((city) => {
    if (city["cityCode"] == getUser().user.location.cityCode) {
      userOrigin = `${city.cityCode}-${city.name}`;
    }
  });
</script>

<div>Unloading</div>
<div class="container">
  <form on:submit={onFormSubmit}>
    <div class="row-container filter-container">
      <div class="column-container">
        <div class="grid-container">
          <div class="grid-item">
            <Input bind:value={routes} label="Routes" readonly disabled required />
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
            <Input
              bind:value={destinationCity}
              label="Destination City"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={destinationWarehouse}
              label="Destination Hub"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={createdBy}
              label="Created By"
              readonly
              disabled
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
              bind:value={userOrigin}
              label="User City"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={userWarehouse}
              label="User Hub"
              readonly
              disabled
              required
            />
          </div>
        </div>
        <div class="grid-container">
          <div class="grid-item">
            <Input
              bind:value={driverName}
              label="Driver Name"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={vehicle}
              label="Vehicle"
              readonly
              disabled
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
                    disabled={dataSource.length === 0 || submitedDisabled}
                  />
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
        disabled={dataSource.length > 0}
        required
      />
    </div>
  </div>

  <div class="b-pd-2" />
  <Grid {columns} {dataSource} {tableMetadata} />
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
    grid-template-columns: auto auto auto;
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
