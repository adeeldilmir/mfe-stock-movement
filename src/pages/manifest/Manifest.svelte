<script lang="ts">
  import {
    Grid,
    Dropdown,
    Input,
    Dialog,
    Button,
    SpinnerPage,
    AutoComplete,
    Message,
  } from "@swyft-logistics/styleguide";
  import { toast } from "@zerodevx/svelte-toast";
  import { onMount, createEventDispatcher } from "svelte";
  import {
    getData,
    getColumnsSetting,
    getWarehouse,
    getParcel,
    getBag,
    createManifest,
    printManifest,
  } from "./api";
  import cities from "../../store/cities";
  import producttypes from "../../store/producttypes";
  import { ServiceTypes } from "../../common/utils/enums";
  import type { ICity } from "../../common/interfaces/ICity";

  import {
    getUser,
    hasItems,
    checkDuplicateScanEntry,
    isEqual,
    validateRTVChecks,
    removeDuplicateItemsById,
  } from "../../common/utils/utils";
  import { ManifestStatuses } from "../../common/utils/enums";
  import {
    Statuses,
    BaggingStatuses,
    JourneyType,
  } from "../../common/utils/enums";
  import { AuditLogTypes, LabelPrefixes } from "../../common/utils/enums";

  export let progress: any;
  let items: Array<string> = ["Forward", "Return"];
  let cityMap: ICity[] = [];
  let parcelId: string = "";
  let journeyType: string = "";
  let dialog: any;
  let dataSource = []; // TODO: Define interace
  let columns;
  let tableMetadata;
  let warehouseLocations;
  let serviceTypes;
  let currentUser;
  let currentUserId;
  let currentUserEmail;
  let manifestId;
  let originCityDisplayName;
  let originWarehouseDispalyName;
  let originCity;
  let originWareHouse;
  let destinationCity: string;
  let productType = "Standard";
  let serviceType = "Overnight";
  let totalScanned = 0;
  let totalWeight = 0;
  let disableScanning = false;
  let dialogHeaderContent = "";
  let dialogBodyContent = "";
  let showfooter = false;
  let globalParcelData = null;
  let globalBagData = null;
  let cityIdHash = {};
  let auditLog = [];
  const dispatch = createEventDispatcher();

  onMount(async () => {
    let columnSetting = await getColumnsSetting();
    columns = columnSetting.columns;
    tableMetadata = columnSetting.tableMetadata;

    dispatch("show-loader");
    serviceTypes = Object.keys(ServiceTypes).map((item) => {
      return { name: ServiceTypes[item], id: ServiceTypes[item] };
    });
    currentUser = `${getUser().user.firstName} ${getUser().user.lastName}`;
    currentUserId = getUser().userId;
    currentUserEmail = getUser().user.email;

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
      originWarehouseDispalyName = `${warehouseLocation[0].warehouseCode}-${warehouseLocation[0].name}`;
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }

    dispatch("hide-loader");
  });

  function handleRefresh(e) {
    dataSource = [];
    totalScanned = 0;
    totalWeight = 0;
    manifestId = "";
    disableScanning = false;
    auditLog = [];
  }
  function exitHandler(e) {
    journeyType = "";
    destinationCity = "";
    productType = "";
    serviceType = "";
    totalScanned = 0;
    totalWeight = 0;
    dataSource = [];
    manifestId = "";
    disableScanning = false;
    auditLog = [];
  }

  function removeHandler(e) {
    const deletedRow = dataSource.splice(e.detail.rowId, 1);
    dataSource = [...dataSource];
    totalScanned = totalScanned - 1;
    totalWeight = totalWeight - deletedRow[0].weight;

    const auditLogDeletedRowIndex = auditLog.findIndex(
      (item) => item.entityId == deletedRow[0].id
    );
    if (auditLogDeletedRowIndex > -1) {
      auditLog.splice(auditLogDeletedRowIndex, 1);
      auditLog = [...auditLog];
    }
  }

  async function scan(id: string) {
    if (id) {
      id = id.trim();
      if (checkDuplicateScanEntry(dataSource, id)) {
        parcelId = "";
        // toast.push("Item Already Scan", { classes: ["error"] });

        dialogBodyContent = "Item Already Scan";
        dialogHeaderContent = "Error";
        dialog.toggle();
      } else {
        if (id.slice(0, 3) == "BAG" || id.slice(0, 1) == LabelPrefixes.BAGS) {
          try {
            const res = await getBag(id);
            if (res.error) {
              throw new Error(res.error);
            }

            if (isEqual(res.currentStatusId, BaggingStatuses.DEMANIFESTED)) {
              if (
                !(
                  isEqual(
                    originCity,
                    res.statusHistory[res.statusHistory.length - 2]
                      .destinationCity
                  ) &&
                  isEqual(
                    originWareHouse,
                    res.statusHistory[res.statusHistory.length - 2]
                      .destinationWarehouse
                  )
                )
              ) {
                dialogBodyContent =
                  "Demanifested Bag is not at correct Location";
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                return;
              }
            } else if (
              !isEqual(originCity, res.originCity) ||
              !isEqual(originWareHouse, res.originWarehouse)
            ) {
              // toast.push("Invalid Origin City", { classes: ["error"] });
              dialogBodyContent = `Bag ${res.baggingId} is not at correct origin warehouse.`;
              dialogHeaderContent = "Error";
              dialog.toggle();
              parcelId = "";
              return;
            }

            if (isEqual(journeyType, JourneyType.FORWARD)) {
              if (!isEqual(res.journeyTypeCode, JourneyType.FORWARD)) {
                // toast.push("Bag Journey type must be Forward.", {
                //   classes: ["error"],
                // });
                dialogBodyContent = "Bag Journey type must be Forward.";
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                return;
              } else if (!isEqual(destinationCity, res["destinationCity"])) {
                // toast.push("Invalid Destination City", { classes: ["error"] });
                dialogBodyContent = "Invalid Destination City";
                dialogHeaderContent = "Error";
                dialog.toggle();

                parcelId = "";
                return;
              }
            } else if (isEqual(journeyType, JourneyType.RETURN)) {
              if (!isEqual(res.journeyTypeCode, JourneyType.RETURN)) {
                // toast.push("Bag Journey type must be Return.", {
                //   classes: ["error"],
                // });
                dialogBodyContent = "Bag Journey type must be Return.";
                dialogHeaderContent = "Error";
                dialog.toggle();

                parcelId = "";
                return;
              } else if (!isEqual(destinationCity, res["destinationCity"])) {
                dialogBodyContent =
                  "Bag destination city and selected destination city do not match.";
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                globalParcelData = null;
                return;
              }
            }

            if (
              isEqual(
                res.currentStatusId,
                BaggingStatuses.DEMANIFESTED
              )
            ) {
              if (
                !(
                  isEqual(
                    originCity,
                    res.statusHistory[
                      res.statusHistory.length - 2
                    ].destinationCity
                  ) &&
                  isEqual(
                    originWareHouse,
                    res.statusHistory[
                      res.statusHistory.length - 2
                    ].destinationWarehouse
                  )
                )
              ) {
                dialogBodyContent =
                  "Demanifested Bag is not at correct Location";
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                return;
              }
            } else if (
              !isEqual(originCity, res.originCity) ||
              !isEqual(originWareHouse, res.originWarehouse)
            ) {
              // toast.push("Invalid Origin City", { classes: ["error"] });
              dialogBodyContent = `Bag ${res.baggingId} is not at correct origin warehouse.`;
              dialogHeaderContent = "Error";
              dialog.toggle();
              parcelId = "";
              return;
            }

            globalBagData = res;
            globalParcelData = null;
            scanBag();
          } catch (error) {
            // toast.push("Invalid Bag Id", { classes: ["error"] });
            dialogBodyContent = "Invalid Bag Id";
            dialogHeaderContent = "Error";
            dialog.toggle();

            parcelId = "";
          }
        } else {
          try {
            const res = await getParcel(id);
            if (res.error) {
              throw new Error(res.error);
            }
            if (isEqual(journeyType, JourneyType.FORWARD)) {
              if (isEqual(res.previousStatusId, Statuses.CANCELLED)) {
                // toast.push("Parcel previous Status can not be cancelled", {
                //   classes: ["error"],
                // });
                dialogBodyContent = `Parcel ${res.id} previous Status can not be cancelled`;
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                return;
              } else if (!isEqual(destinationCity, res["city"]["cityCode"])) {
                // toast.push("Invalid Destination City", { classes: ["error"] });
                dialogBodyContent = "Invalid Destination City";
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                return;
              }

              const error = validateRTVChecks(res, JourneyType.FORWARD);
              if (error) {
                dialogHeaderContent = "Error";
                dialogBodyContent = `${res.id} is invalid for Forward Manifest.`;
                dialog.toggle();
                parcelId = "";
                return;
              }
            } else if (isEqual(journeyType, JourneyType.RETURN)) {
              const error = validateRTVChecks(res);
              if (error) {
                dialogHeaderContent = "Error Occured";
                dialogBodyContent = error;
                dialog.toggle();
                parcelId = "";
                return;
              }

              if (
                !isEqual(
                  destinationCity,
                  cityIdHash[res["originCityId"]].cityCode
                )
              ) {
                // toast.push("Invalid Origin City", { classes: ["error"] });
                dialogBodyContent = `Parcel ${res.id} origin city and selected destination city do not match. Do you want to continue?`;
                dialogHeaderContent = "Error";
                dialog.toggle();
                parcelId = "";
                globalParcelData = res;
                globalBagData = null;
                showfooter = true;
                return;
              }
            }

            globalParcelData = res;
            globalBagData = null;
            scanParcel();
          } catch (error) {
            // toast.push("Invalid Parcel Id", { classes: ["error"] });
            dialogBodyContent = "Invalid Parcel Id";
            dialogHeaderContent = "Error";
            dialog.toggle();
            parcelId = "";
          }
        }
      }
    }
  }

  function scanBag() {
    if (
      isEqual(globalBagData.currentStatusId, [
        BaggingStatuses.NEW,
        BaggingStatuses.DEMANIFESTED,
      ])
    ) {
      globalBagData.weight = parseFloat(globalBagData.weight.toFixed(3));
      dataSource = [
        {
          id: globalBagData.baggingId,
          type: "BAG",
          weight: globalBagData.weight,
          pieces: globalBagData.parcelIds.length,
          rowSpecificButtons: [{ label: "Remove", action: "remove-handler" }],
        },
        ...dataSource,
      ];
      parcelId = "";

      dataSource = removeDuplicateItemsById(dataSource);          
      totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0)
      totalWeight = parseFloat((totalWeight).toFixed(3));
      totalScanned =dataSource.length;
      toast.push("Bag Scan Successfully.", {
        classes: ["success"],
      });
    } else {
      // toast.push("Bag is not at Required status", {
      //   classes: ["error"],
      // });
      dialogBodyContent = "Bag is not at Required status";
      dialogHeaderContent = "Error";
      dialog.toggle();
      parcelId = "";
    }
  }

  function scanParcel() {
    if (
      isEqual(globalParcelData.currentStatusId, Statuses.AT_SWYFT_WAREHOUSE)
    ) {
      globalParcelData.weight = parseFloat(globalParcelData.weight.toFixed(3));
      dataSource = [
        {
          id: globalParcelData.id,
          type: "CN",
          weight: globalParcelData.weight,
          pieces: 1,
          vendorName: globalParcelData.vendor.name,
          originCity: cityIdHash[globalParcelData.originCityId].name,
          destinationCity: cityIdHash[globalParcelData.cityId].name,
          rowSpecificButtons: [{ label: "Remove", action: "remove-handler" }],
        },
        ...dataSource,
      ];
      parcelId = "";

      dataSource = removeDuplicateItemsById(dataSource);
      totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
      totalWeight = parseFloat((totalWeight).toFixed(3));
      totalScanned = dataSource.length;

      toast.push("Parcel Scan Successfully.", {
        classes: ["success"],
      });
    } else {
      // toast.push("Parcel is not at Swyft Warehouse", {
      //   classes: ["error"],
      // });
      dialogBodyContent = `Parcel ${globalParcelData.id} is not at Swyft Warehouse`;
      dialogHeaderContent = "Error";
      dialog.toggle();
      parcelId = "";
    }
  }

  async function onSubmitHandler(e) {
    e.preventDefault();
    if (hasItems(totalScanned)) {
      let content = dataSource.map((item) => {
        return {
          id: item.id,
          type: item.type,
          weight: item.weight,
          pieces: item.pieces,
        };
      });
      const payload = {
        productTypeCode: productType,
        journeyTypeCode: journeyType,
        serviceTypeCode: serviceType,
        content: content,
        originCity: originCity,
        originWarehouse: originWareHouse,
        destinationCity: destinationCity,
        source: "admin",
        sourceId: currentUserId,
        weight: totalWeight,
        currentStatusId: ManifestStatuses.NEW,
        statusHistory: [
          {
            status: ManifestStatuses.NEW,
            journeyTypeCode: journeyType,
            originCity: originCity,
            originWarehouse: originWareHouse,
            destinationCity: destinationCity,
            creator: "admin",
            createdBy: currentUserEmail,
          },
        ],
        auditLog: auditLog,
      };
      try {
        dispatch("show-loader");

        const res = await createManifest(payload);
        if (res.error) {
          throw new Error(res.error.message);
        } else {
          manifestId = res.manifestId;
          disableScanning = true;
          //await printManifestHandler();
          const printRes = await printManifest(manifestId);
          window.open(printRes["url"]);
          toast.push("Manifest created successfully...", {
            classes: ["success"],
          });
        }
      } catch (error) {
        // toast.push("Something went wrong", { classes: ["error"] });
        dialogBodyContent = error.message;
        dialogHeaderContent = "Error";
        dialog.toggle();
      }
      dispatch("hide-loader");
    } else {
      // toast.push("List should not be empty", { classes: ["error"] });
      dialogBodyContent = "List should not be empty";
      dialogHeaderContent = "Error";
      dialog.toggle();
      return;
    }
  }

  function onProccedClickHandler(e) {
    if (globalBagData) {
      scanBag();

      auditLog = [
        ...auditLog,
        {
          entity: "bag",

          entityId: globalBagData.baggingId,

          originCity: globalBagData.originCity,

          returnCity: destinationCity,

          type: AuditLogTypes.ORIGIN_CITY_CHANGE,
        },
      ];

      dialog.toggle();
      showfooter = false;
      globalBagData = null;
    } else if (globalParcelData) {
      scanParcel();

      auditLog = [
        ...auditLog,
        {
          entity: "parcel",

          entityId: globalParcelData.id,

          originCity: cityIdHash[globalParcelData.originCityId].cityCode,

          returnCity: destinationCity,

          type: AuditLogTypes.ORIGIN_CITY_CHANGE,
        },
      ];

      dialog.toggle();
      showfooter = false;
      globalParcelData = null;
    }
  }

  function onNoClickHandler(e) {
    parcelId = "";
    globalBagData = null;
    globalParcelData = null;
    dialog.toggle();
  }

  $: $cities.forEach((city) => {
    if (city["cityCode"] == getUser().user.location.cityCode) {
      originCityDisplayName = `${city.cityCode}-${city.code}`;
      originCity = city.cityCode;
    }
    cityIdHash[city.id] = {
      name: city.name,
      code: city.code,
      cityCode: city.cityCode,
    };
  });
</script>

<!-- svelte-ignore non-top-level-reactive-declaration -->
<div>Manifest</div>

<div style="--modal-body-max-height:300px;">
  <Dialog bind:this={dialog} header={dialogHeaderContent}>
    <div slot="dialog-content" class="full-width">
        {#if dialogBodyContent}
          {#each dialogBodyContent.split(",") as error}
            <Message message={error} type="error" open={true} />
          {/each}
        {/if}
        <div class="grid-container" style="width:30%; margin:0px auto;" />
    </div>

    <div class="full-width" slot="dialog-footer">
      <div class="flex display-flex justify-content padding">
        {#if showfooter}
          <div>
            <Button
              class="error"
              label="Proceed"
              on:click={onProccedClickHandler}
            />
          </div>
          <div>
            <Button label="No" on:click={onNoClickHandler} />
          </div>
        {/if}
      </div>
    </div>
    <!-- <div class="full-width" slot="dialog-footer">
      <div class="flex justify-content">
        <div>
          {#if Object.keys(disputedManifestContent).length}
            <Button
              label="Mark Disputed"
              on:click={onMarkDisputetSubmitHandler}
            />
          {/if}
        </div>
      </div>
    </div> -->
  </Dialog>
</div>

<div class="container">
  <form on:submit={onSubmitHandler}>
    <div class="row-container filter-container">
      <div class="column-container">
        <div class="grid-container">
          <div class="grid-item">
            <AutoComplete
              bind:value={journeyType}
              label="Journey"
              placeholder="Select Journey Type"
              {items}
              required
              disabled={dataSource.length}
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              bind:value={destinationCity}
              label="Destination City"
              placeholder="Select Destination City"
              displayProperty="name"
              valueProperty="id"
              items={$cities.map((data) => ({
                id: data.cityCode,
                name: data.cityCode + "-" + data.code,
              }))}
              required
              disabled={dataSource.length}
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              label="Product Type"
              placeholder="Select Product Type"
              displayProperty="name"
              valueProperty="code"
              items={$producttypes}
              bind:value={productType}
              required
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              label="Service"
              placeholder="Select Service"
              displayProperty="name"
              valueProperty="name"
              items={serviceTypes}
              bind:value={serviceType}
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
              bind:value={originWarehouseDispalyName}
              label="Origin Hub"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={currentUser}
              label="User"
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
                    disabled={totalScanned === 0 || manifestId}
                  />
                </div>
              </div>
    
              <div class="grid-item">
                <div class="buttons">
                  <Button label="Clear" on:click={handleRefresh} />
                </div>
              </div>
              <div class="grid-item">
                <div class="buttons">
                  <Button label="Exit" on:click={exitHandler} />
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
            <h3 class="ft-large">{totalScanned}</h3>
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
        bind:value={parcelId}
        label="CN/Bag"
        on:change={(e) => {
          scan(e.target.value);
        }}
        disabled={!journeyType || !destinationCity || disableScanning}
      />
    </div>

    <div class="grid-item">
      <Input bind:value={manifestId} label="Manifest ID" readonly disabled />
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
  .padding {
    padding: 0px 10px;
  }

  .justify-content {
    justify-content: space-between;
  }

  .full-width {
    width: 100%;
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

  .flex-center {
    justify-content: center;
    align-items: center;
  }
</style>
