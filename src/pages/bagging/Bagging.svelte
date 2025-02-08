<script lang="ts">
  import {
    Grid,
    Dropdown,
    Input,
    Button,
    Dialog,
    AutoComplete,
    Message,
  } from "@swyft-logistics/styleguide";
  import { onMount, createEventDispatcher } from "svelte";
  import {
    getColumnsSetting,
    getParcelData,
    createBag,
    getDetailsLabel,
    getWarehouse,
    getBaggingLabel,
    getBagCode,
    getBag,
  } from "./api";
  import cities from "../../store/cities";
  import { toast } from "@zerodevx/svelte-toast";
  import {
    checkDuplicateScanEntry,
    getUser,
    hasItems,
    isEqual,
    isExists,
    validateRTVChecks,
    removeDuplicateItemsById
  } from "../../common/utils/utils";
  import {
    Statuses,
    BaggingStatuses,
    LabelPrefixes,
    JourneyType,
  } from "../../common/utils/enums";
  import type { IColumns } from "../../common/interfaces/IColumns";
  import type { ITableMetaData } from "../../common/interfaces/ITableMetadata";
  import { AuditLogTypes } from "../../common/utils/enums";

  export let progress;
  let items = ["Forward", "Return"];
  let productTypes = ["Corporate", "Standard"];
  let serviceTypes = ["Express", "Overnight", "Overland"];
  let parcelId = "";
  let journeyType = "";
  let serviceType = "Overnight";
  let productType = "Standard";
  let dataSource = [];
  let columns: Array<IColumns>;
  let originWareHouse: any;
  let tableMetadata: ITableMetaData;
  let userData = getUser();
  let totalScanned = 0;
  let totalWeight = 0;
  let bagNumber = "";
  let selectedCity: string = "";
  let currentUser: string;
  let currentUserId: string;
  let currentUserEmail: string;
  let originWarehouseDisplayName: string;
  let originCityDisplayName: string;
  let originCity: string;
  let buttonDisabled = true;
  let warehouseCityCode: string;
  let disableScanning = true;
  let dialog;
  let dialogContent;
  let wrapper;
  let dialogError;
  let inputCn = null;
  let showfooter = false;
  let globalParcelData = null;
  let cityIdHash = {};
  let auditLog = [];
  const dispatch = createEventDispatcher();

  onMount(async () => {
    let columnSetting = await getColumnsSetting();

    columns = columnSetting.columns;
    tableMetadata = columnSetting.tableMetadata;

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
      warehouseCityCode = warehouseLocation[0].cityCode;
      originWarehouseDisplayName = `${warehouseLocation[0].warehouseCode}-${warehouseLocation[0].name}`;
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  });

  function handleDestinationCity(e: string) {
    disableScanning = false;
  }

  async function handleBaggingInput(e: string) {
    if (!isEqual(e.length, 12) || !isEqual(e.substring(0, 3), "BAG")) {
      if (
        isEqual(e.substring(0, 1), LabelPrefixes.BAGS) &&
        (isEqual(e.length, 9) || isEqual(e.length, 8))
      ) {
        let code = await getBagCode(e);
        if (code.error) {
          dialogContent = "Error Occured";
          dialogError = "Bag code does not exist";
          dialog.toggle();
          toast.push("Bag code does not exist", { classes: ["error"] });
          bagNumber = "";
          return;
        }

        let duplicateCheck = await getBag(e);
        if (duplicateCheck.status == 404) {
          inputCn.focus();

          toast.push(`BagID-${e} scanned`, {
            classes: ["success"],
            duration: 500,
          });
          return;
        } else if (
          duplicateCheck !== null ||
          Object.keys(duplicateCheck).length === 0
        ) {
          dialogContent = "Error Occured";
          dialogError = "Duplicate Bag ID entered";
          dialog.toggle();
          toast.push("Duplicate Bag ID entered", { classes: ["error"] });
          bagNumber = "";
          return;
        }
      } else {
        dialogContent = "Error Occured";
        dialogError = "Invalid Bagging Id Entered";
        dialog.toggle();
        toast.push("Invalid Bagging Id Entered", { classes: ["error"] });
        bagNumber = "";
      }
    } else if (isEqual(e.length, 12) && isEqual(e.substring(0, 3), "BAG")) {
      let code = await getBagCode(e);
      if (code.error) {
        dialogContent = "Error Occured";
        dialogError = "Bag code does not exist";
        dialog.toggle();
        bagNumber = "";
        return;
      }

      let duplicateCheck = await getBag(e);
      if (duplicateCheck.status == 404) {
        inputCn.focus();

        toast.push(`BagID-${e} scanned`, {
          classes: ["success"],
          duration: 500,
        });
        return;
      } else if (
        duplicateCheck !== null ||
        Object.keys(duplicateCheck).length === 0
      ) {
        dialogContent = "Error Occured";
        dialogError = "Duplicate Bag ID entered";
        dialog.toggle();
        toast.push("Duplicate Bag ID entered", { classes: ["error"] });
        bagNumber = "";
        return;
      }
    }
  }

  async function handleParcelInput(id) {
    if (!isEqual(id.length, 15)) {
      dialogContent = "Error Occured";
      dialogError = "Invalid Parcel ID entered";
      dialog.toggle();
      toast.push("Invalid Parcel ID entered", { classes: ["error"] });
      parcelId = "";
      return;
    }
    if (!isExists(bagNumber)) {
      dialogContent = "Error Occured";
      dialogError = "Enter a valid bag number";
      dialog.toggle();
      toast.push("Enter a valid bag number", { classes: ["error"] });
      parcelId = "";
      return;
    }
    if (id) {
      id = id.trim();
      if (checkDuplicateScanEntry(dataSource, id)) {
        parcelId = "";
        dialogContent = "Error Occured";
        dialogError = "Parcel Already Scan";
        dialog.toggle();
        toast.push(`Parcel: ${id} Already Scan`, { classes: ["error"] });
      } else {
        try {
          const parcelData = await getParcelData(id);
          if (parcelData.error) {
            throw new Error(parcelData.error);
          }
          if (isEqual(journeyType, "Forward")) {
            forwardStatus(parcelData);
          } else {
            returnStatus(parcelData);
          }
        } catch (error) {
          console.log(error);
          dialogContent = "Error Occured";
          dialogError = "Something went wrong";
          dialog.toggle();
          toast.push("Something went wrong", { classes: ["error"] });
        }
      }
    }
  }

  function forwardStatus(parcelData) {
    if (isEqual(parcelData.currentStatusId, Statuses.AT_SWYFT_WAREHOUSE)) {
      if (!isEqual(parcelData.previousStatusId, Statuses.CANCELLED)) {
        if (
          isEqual(
            parcelData.city.cityCode,
            $cities.find((data) => data.cityCode === selectedCity).cityCode
          )
        ) {
          const error = validateRTVChecks(parcelData, JourneyType.FORWARD);
          if (error) {
            dialogContent = "Error Occured";
            dialogError = `${parcelData.id} is invalid for Forward Bagging`;
            dialog.toggle();
            parcelId = "";
            return;
          }

          let newObj = [
            {
              id: parcelData.id,
              amount: parcelData.amount,
              weight: parcelData.weight,
              vendorName: parcelData.vendor.name,
              originCity: cityIdHash[parcelData.originCityId].name,
              destinationCity: cityIdHash[parcelData.cityId].name,
              rowSpecificButtons: [
                { label: "Remove", action: "remove-handler" },
              ],
            },
          ];
          dataSource = newObj.concat(dataSource);
          buttonDisabled = true;
          parcelId = "";

          dataSource = removeDuplicateItemsById(dataSource);
                    
          totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0)

          totalWeight = parseFloat(
            (totalWeight).toFixed(3)
          );
          toast.push(`Parcel ID-${parcelData.id} scanned`, {
            classes: ["success"],
            duration: 500,
          });
        } else {
          dialogContent = "Error Occured";
          dialogError = `Parcel: ${parcelData.id} is not in the same city as the destination city`;
          dialog.toggle();
          toast.push(
            `Parcel: ${parcelData.id} is not in the same city as the destination city`,
            {
              classes: ["error"],
            }
          );
          parcelId = "";
        }
      } else {
        dialogContent = "Error Occured";
        dialogError = `Parcel: ${parcelData.id}  previous status should not be cancelled`;
        dialog.toggle();
        toast.push(
          `Parcel: ${parcelData.id} previous status should not be cancelled`,
          {
            classes: ["error"],
          }
        );
        parcelId = "";
      }
    } else {
      dialogContent = "Error Occured";
      dialogError = `Parcel: ${parcelData.id} is not at swyft warehouse`;
      dialog.toggle();
      toast.push(`Parcel: ${parcelData.id} is not at swyft warehouse`, {
        classes: ["error"],
      });
      parcelId = "";
    }
  }

  function returnStatus(parcelData) {
    const error = validateRTVChecks(parcelData);
    if (error) {
      dialogContent = "Error Occured";
      dialogError = error;
      dialog.toggle();
      parcelId = "";
      return;
    }

    if (
      isEqual(
        $cities.find(
          (data) => data.id.toString() === parcelData.originCityId.toString()
        ).cityCode,
        $cities.find((data) => data.cityCode === selectedCity).cityCode
      )
    ) {
      let newObj = [
        {
          id: parcelData.id,
          amount: parcelData.amount,
          weight: parcelData.weight,
          vendorName: parcelData.vendor.name,
          originCity: cityIdHash[parcelData.originCityId].name,
          destinationCity: cityIdHash[parcelData.cityId].name,
          rowSpecificButtons: [{ label: "Remove", action: "remove-handler" }],
        },
      ];
      dataSource = newObj.concat(dataSource);
      buttonDisabled = true;
      parcelId = "";
      dataSource = removeDuplicateItemsById(dataSource);                    
      totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0)
      totalWeight = parseFloat((totalWeight).toFixed(3));
      toast.push(`Parcel ID-${parcelData.id} scanned`, {
        classes: ["success"],
        duration: 500,
      });
    } else {
      dialogContent = "Error Occured";
      dialogError = `Parcel ${parcelData.id} origin city and selected destination city do not match. Do you want to continue?`;
      dialog.toggle();
      parcelId = "";
      showfooter = true;
      globalParcelData = parcelData;
    }
  }

  async function onSubmitHandler(e) {
    e.preventDefault();
    if (hasItems(dataSource.length)) {
      const payload = {
        sourceId: currentUserId,
        source: "admin",
        journeyTypeCode: journeyType,
        productTypeCode: productType,
        serviceTypeCode: serviceType,
        originCity: originCity,
        originWarehouse: originWareHouse,
        destinationCity: selectedCity,
        weight: totalWeight,
        baggingId: bagNumber,
        parcelIds: dataSource.map((data) => data.id),
        currentStatusId: BaggingStatuses.NEW,
        statusHistory: [
          {
            status: BaggingStatuses.NEW,
            journeyTypeCode: journeyType,
            originCity: originCity,
            originWarehouse: originWareHouse,
            destinationCity: selectedCity,
            creator: "admin",
            createdBy: currentUserEmail,
          },
        ],
        auditLog: auditLog,
      };
      try {
        dispatch("show-loader");
        let data = await createBag(payload);
        if (data.error === "Duplicate bagging ID entered") {
          toast.push(data.error, { classes: ["error"] });
          dispatch("hide-loader");
          bagNumber = "";
          buttonDisabled = false;
          return;
        }
        if (data.error) {
          throw new Error(data.error.message);
        } else {
          let res = await getDetailsLabel(data.baggingId);
          window.open(res.url);
          let label = await getBaggingLabel(data.baggingId);
          window.open(label.url);
          toast.push("Bag has been created", { classes: ["success"] });
          dataSource = [];
          buttonDisabled = false;
          totalWeight = 0;
          totalScanned = 0;
          bagNumber = "";
          parcelId = "";
          auditLog = [];
        }
      } catch (error) {
        if (error) {
          dialogContent = "Error Occured";
          dialogError = error.message;
          dialog.toggle();
        } else {
          dialogContent = "Error Occured";
          dialogError = "Something went wrong";
          dialog.toggle();
          toast.push("Something went wrong", { classes: ["error"] });
        }
      }
      dispatch("hide-loader");
    } else {
      dialogContent = "Error Occured";
      dialogError = "List should not be empty";
      dialog.toggle();
      toast.push("List should not be empty", { classes: ["error"] });
      return;
    }
  }

  function handler() {
    bagNumber = "";
    journeyType = "";
    serviceType = "Overnight";
    productType = "Standard";
    selectedCity = "";
    dataSource = [];
    buttonDisabled = false;
    totalWeight = 0;
    totalScanned = 0;
    parcelId = "";
    auditLog = [];
  }

  function fixFormReset(el) {
    disableScanning = true;
    bagNumber = "";
    dataSource = [];
    buttonDisabled = false;
    totalWeight = 0;
    totalScanned = 0;
    parcelId = "";
    auditLog = [];
  }

  function removeHandler(e) {
    const deletedRow = dataSource.splice(e.detail.rowId, 1);
    dataSource = [...dataSource];
    totalWeight = parseFloat((totalWeight - deletedRow[0].weight).toFixed(3));

    const auditLogDeletedRowIndex = auditLog.findIndex(
      (item) => item.entityId == deletedRow[0].id
    );
    if (auditLogDeletedRowIndex > -1) {
      auditLog.splice(auditLogDeletedRowIndex, 1);
      auditLog = [...auditLog];
    }
  }

  function onProccedClickHandler(e) {
    if (globalParcelData) {
      let newObj = [
        {
          id: globalParcelData.id,
          amount: globalParcelData.amount,
          weight: globalParcelData.weight,
          vendorName: globalParcelData.vendor.name,
          originCity: cityIdHash[globalParcelData.originCityId].name,
          destinationCity: cityIdHash[globalParcelData.cityId].name,
          rowSpecificButtons: [{ label: "Remove", action: "remove-handler" }],
        },
      ];
      dataSource = newObj.concat(dataSource);
      buttonDisabled = true;
      parcelId = "";
      totalWeight = parseFloat(
        (totalWeight + globalParcelData.weight).toFixed(3)
      );

      auditLog = [
        ...auditLog,
        {
          entity: "parcel",

          entityId: globalParcelData.id,

          originCity: cityIdHash[globalParcelData.originCityId].cityCode,

          returnCity: selectedCity,

          type: AuditLogTypes.ORIGIN_CITY_CHANGE,
        },
      ];

      dialog.toggle();
      showfooter = false;
      globalParcelData = null;

      toast.push(`Parcel ID-${globalParcelData.id} scanned`, {
        classes: ["success"],
        duration: 500,
      });
    }
  }

  function onNoClickHandler(e) {
    parcelId = "";
    dialog.toggle();
  }

  $: $cities.forEach((city) => {
    if (city["cityCode"] == getUser().user.location.cityCode) {
      originCityDisplayName = `${city.cityCode}-${city.name}`;
      originCity = city.cityCode;
    }

    cityIdHash[city.id] = {
      name: city.name,
      code: city.code,
      cityCode: city.cityCode,
    };
  });
</script>

<div>Bagging</div>
<div style="--modal-body-max-height:300px;">
  <Dialog bind:this={dialog} header={dialogContent}>
    <div slot="dialog-content" class="full-width">     
        {#if dialogError}
          {#each dialogError.split(",") as error}
            <Message message={error} type="error" open={true} />
          {/each}
        {/if}
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
  </Dialog>
</div>
<div class="container" bind:this={wrapper}>
  <form name="baggingForm" on:submit={onSubmitHandler}>
    <div class="row-container filter-container">
      <div class="column-container" >
        <div class="grid-container">
          <div class="grid-item">
            <AutoComplete
              bind:value={journeyType}
              label="Bagging Type"
              placeholder="Select Bagging Type"
              {items}
              required
              disabled={dataSource.length > 0}
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              bind:value={productType}
              label="Product Type"
              placeholder="Select Product Type"
              items={productTypes}
              required
            />
          </div>
          <div class="grid-item" style="width: 70%;">
            <AutoComplete
              bind:value={serviceType}
              label="Service"
              placeholder="Select Service Type"
              items={serviceTypes}
              required
            />
          </div>
          <div class="grid-item">
            <AutoComplete
              bind:value={selectedCity}
              on:value-changed={(e) => handleDestinationCity(e.detail.value)}
              label="Destination City"
              displayProperty="name"
              valueProperty="id"
              placeholder="Select City"
              items={$cities.map((data) => ({
                id: data.cityCode,
                name: `${data.cityCode}-${data.code}`,
              }))}
              disabled={dataSource.length > 0}
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
                <Button label="Clear" on:click={fixFormReset} />
              </div>
            </div>
            <div class="grid-item">
              <div class="buttons">
                <Button label="Exit" on:click={handler} />
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
        bind:value={bagNumber}
        on:change={(e) => handleBaggingInput(e.target.value)}
        label="Bag ID"
        disabled={dataSource.length > 0 && buttonDisabled}
      />
    </div>
    <div class="grid-item">
      <Input
        id="cn"
        bind:value={parcelId}
        on:change={(e) => handleParcelInput(e.target.value)}
        bind:this={inputCn}
        label="CN"
        disabled={journeyType === "" || selectedCity === "" || bagNumber === ""}
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

  .row-container {
    display: flex;
    flex-direction: row;
  }

  .ft-large {
    font-size: 6rem;
    font-weight: bold;
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
