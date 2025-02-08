<script lang="ts">
  import {
    Grid,
    Input,
    Button,
    Dialog,
    AutoComplete,
  } from "@swyft-logistics/styleguide";
  import { onMount, tick, createEventDispatcher } from "svelte";
  import cities from "../../store/cities";
  import warehouses from "../../store/warehouse";
  import { toast } from "@zerodevx/svelte-toast";
  import {
    bagExists,
    getColumnsSetting,
    getParcelData,
    getWarehouse,
    updateBagStatus,
    getManifestByBagId,
  } from "./api";
  import {
    checkDuplicateScanEntry,
    getUser,
    isEqual,
    isExists,
    isTolerated,
    removeDuplicateItemsById,
  } from "../../common/utils/utils";
  import {
    DisputeTypes,
    LabelPrefixes,
    BaggingStatuses,
    OtherDisputes,
  } from "../../common/utils/enums";

  export let progress;
  let columns;
  let tableMetadata;
  let parcelId = "";
  let journeyType = "";
  let serviceType = "";
  let productType = "";
  let dataSource = [];
  let totalScanned = 0;
  let totalWeight = 0;
  let bagNumber = "";
  let disputedData = [];
  let currentUser: string;
  let createdBy: string;
  let originWareHouse: any;
  let currentUserId: string;
  let warehouseCityCode: string;
  let destinationCity;
  let enteredWeight = 0;
  let originCity = "";
  let bagEntered = false;
  let dialogContent;
  let disputeMarked = false;
  let originCityDisplayName: string;
  let originWarehouseDisplayName: string;
  let disableConfirmDebagging = true;
  let debaggingContent;
  let bag;
  let dialog: any;
  let disputed: any;
  let inputCn = null;
  let cityIdHash = {};
  let otherDisputeItems = [];
  let disputedItem = { id: "", reason: "", comment: "", index: null };
  let isDispute = false;
  let showDisputeList = true;
  let allowedLocationsIds = [];
  const dispatch = createEventDispatcher();

  onMount(async () => {
    let columnSetting = await getColumnsSetting();
    columns = columnSetting.columns;
    tableMetadata = columnSetting.tableMetadata;

    currentUser = `${getUser().user.firstName} ${getUser().user.lastName}`;
    currentUserId = getUser().userId;

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
    } catch (error) {
      toast.push("Something went wrong", { classes: ["error"] });
    }
  });

  function handleWeightInput(weight) {
    // if (isExists(weight)) {
    enteredWeight = weight.trim();
    handleBagInput(bagNumber);
    // }
  }

  async function handleBagInput(bagId) {
    try {
      if (bagId) {
        if (
          !isEqual(bagId.length, 12) ||
          !isEqual(bagId.substring(0, 3), "BAG")
        ) {
          if (
            !isEqual(bagId.substring(0, 1), LabelPrefixes.BAGS) &&
            !isEqual(bagId.length, 9)
          ) {
            toast.push("Invalid Bagging Id Entered", { classes: ["error"] });
            bagNumber = "";
            return;
          }
        }
        if (isExists(bagId)) {
          bagId = bagId.trim();
          // if (!isExists(enteredWeight)) {
          //   let bagData = await bagExists(bagId);
          //   if (
          //     !isEqual(bagData.destinationCity, getUser().user.location.cityCode)
          //   ) {
          //     toast.push("Bag is not at the correct destination city", {
          //       classes: ["error"],
          //     });
          //     bagEntered = false;
          //     bagNumber = "";
          //     enteredWeight = 0;
          //     return;
          //   } else if (!isEqual(bagData.currentStatusId, "Demanifested")) {
          //     toast.push("Bag is not demanifested yet", { classes: ["error"] });
          //     bagEntered = false;
          //     bagNumber = "";
          //     enteredWeight = 0;
          //   } else {
          //     toast.push("Please enter weight", { classes: ["error"] });
          //   }
          // } else {
          let bagExist = await bagExists(bagId);
          console.log(bagExist.erorr);
          if (bagExist.error) {
            if (bagExist.error === `Bag ${bagId} not found`) {
              toast.push("Bag does not exist", { classes: ["error"] });
              bagEntered = false;
              bagNumber = "";
              enteredWeight = 0;
              return;
            } else {
              throw new Error(bagExist.error);
            }
          }
          const body = {
            filters: {
              "content.id": bagId,
            },
            fields: "destinationCity statusHistory",
          };
          const manifestData = await getManifestByBagId(body);
          if (manifestData.error) {
            throw new Error(manifestData.error);
          }
          if (manifestData["results"].length === 0) {
            toast.push(`Bag Status (${bagExist.currentStatusId}) is incorrect`, {
              classes: ["error"],
            });
            bagNumber = "";
            dispatch("hide-loader");
            return;
          }
          const manifestLocation= manifestData["results"][0].statusHistory[manifestData["results"][0].statusHistory.length-1].location
          
          if (
            !isExists(manifestLocation)&& !isEqual(
              manifestData["results"][0]["destinationCity"],
              getUser().user.location.cityCode
            )||
            isExists(manifestLocation)&& !(isEqual(
              manifestLocation.cityCode,
              getUser().user.location.cityCode
            ) 
            &&
            isEqual(
              manifestLocation.warehouseCode,
              getUser().user.location.warehouseCode
            )
            )
          ) {
            toast.push("Shipment not Demanifested at correct destination", {
              classes: ["error"],
            });

            bagEntered = false;
            bagNumber = "";
            enteredWeight = 0;

            dispatch("hide-loader");
            return;
          }

          let bagData = await bagExists(bagId);

          if (getUser().user.allowedLocations) {
            allowedLocationsIds = getUser().user.allowedLocations.map(
              (item) => item.cityCode
            );
          }
          if (
            !isEqual(bagData.destinationCity, [
              getUser().user.location.cityCode,
              ...allowedLocationsIds,
            ])
          ) {
            toast.push("Bag is not at the correct destination city", {
              classes: ["error"],
            });
            bagEntered = false;
            bagNumber = "";
            enteredWeight = 0;
            return;
          }
          if (isEqual(bagData.currentStatusId, "Demanifested")) {
            fetchBagDetails();
          } else {
            toast.push(`Bag Status (${bagData.currentStatusId}) is incorrect`, {
              classes: ["error"],
            });
            bagEntered = false;
            bagNumber = "";
            enteredWeight = 0;
            return;
          }
        }
      }
    } catch (error) {
      console.log(error);
      toast.push(error, { classes: ["error"] });
      dispatch("hide-loader");
    }
  }

  async function fetchBagDetails() {
    dispatch("show-loader");
    bag = await bagExists(bagNumber);
    if (isEqual(bag.currentStatusId, "Demanifested")) {
      debaggingContent = bag.parcelIds;
      originCityDisplayName = `${
        $cities.find((val) => val.cityCode === bag.originCity).cityCode
      }-${$cities.find((val) => val.cityCode === bag.originCity).name}`;
      originWarehouseDisplayName = `${
        $warehouses.find(
          (val) =>
            val.warehouseCode === bag.originWarehouse &&
            val.cityCode === bag.originCity
        ).warehouseCode
      }-${
        $warehouses.find(
          (val) =>
            val.warehouseCode === bag.originWarehouse &&
            val.cityCode === bag.originCity
        ).name
      }`;
      journeyType = bag.journeyTypeCode;
      productType = bag.productTypeCode;
      serviceType = bag.serviceTypeCode;

      createdBy = bag.source;
      destinationCity = `${
        $cities.find((data) => data.cityCode === bag.destinationCity).cityCode
      }-${$cities.find((data) => data.cityCode === bag.destinationCity).code}`;

      bagEntered = true;
      dispatch("hide-loader");
      inputCn.focus();
      // if (false) {  //SOM: functionality disabled, Original condition: isTolerated(Number(enteredWeight), bag.weight)
      // disableConfirmDebagging = false;
      // totalScanned = bag.parcelIds.length;
      // totalWeight = bag.weight;
      // debaggingContent = bag.parcelIds;
      // originCityDisplayName = `${
      //   $cities.find((val) => val.cityCode === bag.originCity).cityCode
      // }-${$cities.find((val) => val.cityCode === bag.originCity).name}`;
      // originWarehouseDisplayName = `${
      //   $warehouses.find(
      //     (val) =>
      //       val.warehouseCode === bag.originWarehouse &&
      //       val.cityCode === bag.originCity
      //   ).warehouseCode
      // }-${
      //   $warehouses.find(
      //     (val) =>
      //       val.warehouseCode === bag.originWarehouse &&
      //       val.cityCode === bag.originCity
      //   ).name
      // }`;
      // let parcels = await Promise.all(
      //   bag.parcelIds.map(async (parcelId) => {
      //     return await getParcelData(parcelId);
      //   })
      // );
      // dataSource = parcels.map((data) => {
      //   return {
      //     id: data.id,
      //     amount: data.amount,
      //     weight: data.weight,
      //     rowSpecificButtons: [
      //       { label: "Dispute", actions: "create-dispute" },
      //     ],
      //   };
      // });
      // } else {
      //   totalWeight = 0;
      //   totalScanned = bag.parcelIds.length;
      //   debaggingContent = bag.parcelIds;
      //   toast.push("Weight not Matched, Start Scanning!", {
      //     classes: ["error"],
      //   });
      // }
    } else {
      totalWeight = 0;
      totalScanned = bag.parcelIds.length;
      debaggingContent = bag.parcelIds;
      toast.push("Bag is not demanifested yet", {
        classes: ["error"],
      });
      return;
    }
  }

  async function handleParcelInput(id) {
    if (id) {
      id = id.trim();
      if (checkDuplicateScanEntry(dataSource, id)) {
        parcelId = "";
        toast.push("Parcel already scanned", { classes: ["error"] });
      } else {
        try {
          const parcelData = await getParcelData(id);
          if (parcelData.error) {
            throw new Error(parcelData.error);
          }
          if (isExists(debaggingContent.includes(parcelData.id))) {
            disableConfirmDebagging = false;
            let newObj = [
              {
                id: id,
                amount: parcelData.amount,
                weight: parcelData.weight,
                vendorName: parcelData.vendor.name,
                originCity: cityIdHash[parcelData.originCityId].name,
                destinationCity: cityIdHash[parcelData.cityId].name,
                reason: "",
                comment: "",
                rowSpecificButtons1: [
                  { label: "Dispute", action: "create-dispute-handler" },
                ],
              },
            ];
            dataSource = newObj.concat(dataSource);
            parcelId = "";

            dataSource = removeDuplicateItemsById(dataSource);       
            totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
            totalWeight = parseFloat((totalWeight).toFixed(3));

          } else {
            disableConfirmDebagging = false;
            let newObj = [
              {
                id: id,
                amount: parcelData.amount,
                weight: parcelData.weight,
                reason: DisputeTypes.EXCESS_RECEIVED,
                vendorName: parcelData.vendor.name,
                comment: "",
                originCity: cityIdHash[parcelData.originCityId].name,
                destinationCity: cityIdHash[parcelData.cityId].name,
                rowSpecificButtons1: [
                  { label: "Dispute", action: "create-dispute-handler" },
                ],
              },
            ];
            dataSource = newObj.concat(dataSource);
            parcelId = "";
            dataSource = removeDuplicateItemsById(dataSource);       
            totalWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
            totalWeight = parseFloat((totalWeight).toFixed(3));
  
          }
        toast.push(`${id} Scanned`, {classes: ["success"]});
        } catch (error) {
          console.log(error);
          toast.push("Something went wrong", { classes: ["error"] });
          parcelId = "";
        }
      }
    }
  }

  async function onConfirmDebaggingHandler(e) {
    e.preventDefault();
    disputedData = [];
    // if (isEqual(totalWeight, bag.weight)) {
    //   const data = {
    //     previousStatusId: bag.currentStatusId,
    //     currentStatusId: BaggingStatuses.CLOSED,
    //     meta: {
    //       status: BaggingStatuses.CLOSED,
    //       journeyTypeCode: bag.journeyTypeCode,
    //       originCity: bag.originCity,
    //       originWarehouse: bag.originWarehouse,
    //       destinationCity: bag.destinationCity,
    //       location: {
    //         cityCode: getUser().user.location.cityCode,
    //         warehouseCode: getUser().user.location.warehouseCode,
    //       },
    //     },
    //   };
    //   dispatch("show-loader");
    //   await updateBagStatus(bag.baggingId, data);
    //   dispatch("hide-loader");

    //   toast.push("Parcel(s) debagged Successfully", {
    //     classes: ["success"],
    //   });
    //   debaggingContent = [];
    //   dialogContent = "";
    //   disputeMarked = true;
    //   exit();
    // } else {
    //Find values that are in result1 but not in result2
    var uniqueResultOne = debaggingContent.filter(function (obj) {
      return !dataSource.some(function (obj2) {
        return obj === obj2.id;
      });
    });
    //Find values that are in result2 but not in result1
    var uniqueResultTwo = dataSource.filter(function (obj) {
      return !debaggingContent.some(function (obj2) {
        return obj.id === obj2;
      });
    });

    if (
      !isEqual(uniqueResultOne.length, 0) ||
      !isEqual(uniqueResultTwo.length, 0) ||
      !isEqual(otherDisputeItems, 0)
    ) {
      const parcels = await Promise.all(
        uniqueResultOne.map((data) => getParcelData(data))
      );

      let missingParcelsData = parcels.map((val) => ({
        id: val.id,
        amount: val.amount,
        weight: val.weight,
        reason: DisputeTypes.SHORT_RECEIVED,
        comment: "",
        rowSpecificButtons1: [
          { label: "Dispute", actions: "create-dispute-handler" },
        ],
      }));
      missingParcelsData = missingParcelsData.concat(uniqueResultTwo);
      dialogContent = "Disputed Items";
      disputedData = missingParcelsData;

      disputedData = [...disputedData, ...otherDisputeItems];

      console.log("Disputd : ", disputedData);
      isDispute = false;
      dialog.toggle();
    } else {
      const data = {
        previousStatusId: bag.currentStatusId,
        currentStatusId: BaggingStatuses.CLOSED,
        meta: {
          status: BaggingStatuses.CLOSED,
          journeyTypeCode: bag.journeyTypeCode,
          originCity: bag.originCity,
          originWarehouse: bag.originWarehouse,
          destinationCity: bag.destinationCity,
          createdBy: getUser().user.email,
          creator: "admin",
          location: {
            cityCode: getUser().user.location.cityCode,
            warehouseCode: getUser().user.location.warehouseCode,
          },
        },
      };
      dispatch("show-loader");
      await updateBagStatus(bag.baggingId, data);
      dispatch("hide-loader");

      toast.push("Parcel(s) debagged Successfully", {
        classes: ["success"],
      });
      debaggingContent = [];
      dialogContent = "";
      disputeMarked = true;
      exit();
    }

    //   const parcels = await Promise.all(
    //     uniqueResultOne.map((data) => getParcelData(data))
    //   );

    //   let missingParcelsData = parcels.map((val) => ({
    //     id: val.id,
    //     amount: val.amount,
    //     weight: val.weight,
    //     reason: DisputeTypes.SHORT_RECEIVED,
    //     comment: "",
    //     rowSpecificButtons: [{ label: "Dispute", actions: "create-dispute" }],
    //   }));
    //   missingParcelsData = missingParcelsData.concat(uniqueResultTwo);
    //   dialogContent = "Disputed Items";
    //   disputedData = missingParcelsData;
    //   dialog.toggle();
    // }

    disableConfirmDebagging = disputeMarked;
  }

  async function onMarkDisputetSubmitHandler(e) {
    e.preventDefault();

    disputeMarked = true;

    disputed = disputedData.map((item) => {
      return { id: item.id, reason: item.reason, description: item.comment };
    });
    const data = {
      previousStatusId: bag.currentStatusId,
      currentStatusId: BaggingStatuses.CLOSED,
      meta: {
        status: BaggingStatuses.CLOSED,
        journeyTypeCode: bag.journeyTypeCode,
        originCity: bag.originCity,
        originWarehouse: bag.originWarehouse,
        destinationCity: bag.destinationCity,
        createdBy: getUser().user.email,
        creator: "admin",
        location: {
          cityCode: getUser().user.location.cityCode,
          warehouseCode: getUser().user.location.warehouseCode,
        },
      },
      disputed: disputed,
    };

    dispatch("show-loader");
    await updateBagStatus(bag.baggingId, data);
    dispatch("hide-loader");
    disputedData = [];
    debaggingContent = [];
    dialogContent = "";

    toast.push("Parcel marked disputed successfully", {
      classes: ["success"],
    });
    await tick();

    toast.push("Parcel(s) debagged Successfully", {
      classes: ["success"],
    });
    onConfirmDebaggingHandler(e);
  }

  function exit() {
    bagEntered = false;
    bagNumber = "";
    bagNumber = "";
    journeyType = "";
    serviceType = "";
    originWarehouseDisplayName = "";
    originCity = "";
    destinationCity = "";
    productType = "";
    dataSource = [];
    totalWeight = 0;
    totalScanned = 0;
    enteredWeight = 0;   
    disputedData = [];
    otherDisputeItems=[];
  }

  function removeHandler(e) {
    const deletedRow = dataSource.splice(e.detail.rowId, 1);
    dataSource = [...dataSource];
    totalWeight = parseFloat((totalWeight - deletedRow[0].weight).toFixed(3));

    // Remove item from disputed data if exists
    const indexOfItem = otherDisputeItems.findIndex(
      (item) => item.id === deletedRow[0].id
    );
    if (indexOfItem != -1) {
      otherDisputeItems.splice(indexOfItem, 1);
    }
  }

  function createDisputeHandler(e) {
    showDisputeList = true;
    disputedItem = {
      id: "",
      reason: "",
      comment: "",
      index: null,
    };

    // if parcel is not disputed as EXCESS RECEIVED
    disputedItem.id = dataSource[e.detail.rowId].id;
    disputedItem.index = e.detail.rowId;

    // if parcel is already in otherDisputeItems
    const indexOfItem = otherDisputeItems.findIndex(
      (item) => item.id === disputedItem.id
    );

    if (indexOfItem != -1) {
      disputedItem.reason = otherDisputeItems[indexOfItem].reason;
      disputedItem.comment = otherDisputeItems[indexOfItem].comment;
    }

    // if parcel is already disputed as EXCESS RECEIVED
    if (dataSource[e.detail.rowId].reason === DisputeTypes.EXCESS_RECEIVED) {
      showDisputeList = false;
      disputedItem.reason = dataSource[e.detail.rowId].reason;
    }
    isDispute = true;
    disputedData = [];
    dialog.toggle();
    console.log("E ", e);
    dialogContent = "Dispute";
  }

  async function onDisputeFormSubmit(e) {
    e.preventDefault();
    isDispute = false;
    if (
      dataSource[disputedItem.index].reason === DisputeTypes.EXCESS_RECEIVED
    ) {
      dataSource[disputedItem.index].comment = disputedItem.comment;
    } else {
      const indexOfItem = otherDisputeItems.findIndex(
        (item) => item.id === disputedItem.id
      );
      if (indexOfItem != -1) otherDisputeItems.splice(indexOfItem, 1);

      otherDisputeItems = [
        ...otherDisputeItems,
        {
          id: disputedItem.id,
          reason: disputedItem.reason,
          comment: disputedItem.comment,
        },
      ];
    }
    console.log("otherDisputeItems ", otherDisputeItems);
    disputedItem = {
      id: "",
      reason: "",
      comment: "",
      index: null,
    };
    dialog.toggle();
  }

  $: $cities.forEach((city) => {
    cityIdHash[city.id] = {
      name: city.name,
      code: city.code,
      cityCode: city.cityCode,
    };
  });
</script>

<div>Debagging</div>

<div style="--modal-body-max-height:300px;--modal-body-min-height:130px">
  <Dialog bind:this={dialog} header={dialogContent}>
    <div slot="dialog-content">
      <div>
        {#if disputedData.length || isDispute}
          <div class="grid-container">
            <div class="grid-item">CN</div>
            <div class="grid-item">Reason</div>
            <div class="grid-item">Comment</div>
          </div>
        {/if}

        {#each disputedData as item}
          <div class="grid-container">
            <div class="grid-item">
              {item.id}
            </div>

            <div class="grid-item">
              {item.reason}
            </div>
            <div class="grid-item">
              <Input bind:value={item["comment"]} placeholder="Comment" />
            </div>
          </div>
        {/each}

        {#if isDispute}
          <form on:submit={onDisputeFormSubmit}>
            <div class="grid-container">
              <div class="grid-item">
                {disputedItem.id}
              </div>

              <div class="grid-item">
                {#if showDisputeList}
                  <AutoComplete
                    bind:value={disputedItem.reason}
                    placeholder="Select Reason"
                    displayProperty="name"
                    valueProperty="id"
                    items={Object.keys(OtherDisputes).map((item) => {
                      return {
                        name: OtherDisputes[item],
                        id: OtherDisputes[item],
                      };
                    })}
                    required
                  />
                {:else}
                  {disputedItem.reason}
                {/if}
              </div>
              <div class="grid-item">
                <Input
                  bind:value={disputedItem.comment}
                  placeholder="Comment"
                />
              </div>
            </div>
          </form>
        {/if}

        <div class="grid-container" style="width:30%; margin:0px auto;" />
      </div>
    </div>

    <div class="full-width" slot="dialog-footer">
      <div class="flex justify-content">
        <div>
          {#if disputedData.length && !isDispute}
            <Button
              label="Mark Disputed"
              on:click={onMarkDisputetSubmitHandler}
            />
          {/if}
          {#if isDispute}
            <Button
              label="Submit"
              type="submit"
              on:click={onDisputeFormSubmit}
              disabled={!disputedItem.reason}
            />
          {/if}
        </div>
      </div>
    </div>
  </Dialog>
</div>
<div class="container">
  <form>
    <div class="row-container filter-container">
      <div class="column-container">
        <div class="grid-container">
          <div class="grid-item">
            <Input
              bind:value={journeyType}
              label="Debagging Type"
              placeholder="Select Bagging Type"
              required
              disabled
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
              label="Destination City"
              bind:value={destinationCity}
              displayProperty="name"
              valueProperty="id"
              placeholder="Select City"
              required
              disabled
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={productType}
              label="Product Type"
              placeholder="Select Product Type"
              required
              disabled
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={serviceType}
              label="Service"
              placeholder="Select Service Type"
              required
              disabled
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
    
          <div class="grid-container">          
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
              <div class="grid-container">
                <div class="grid-item">
                  <div class="buttons">
                    <Button
                      label="Submit"
                      type="submit"
                      disabled={dataSource.length === 0 || disableConfirmDebagging}
                      on:click={onConfirmDebaggingHandler}
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
        on:change={(e) => handleBagInput(e.target.value)}
        label="Bag"
        disabled={bagEntered}
      />
    </div>
    <!-- <div class="grid-item">
      <Input
        bind:value={enteredWeight}
        on:change={(e) => handleWeightInput(e.target.value)}
        label="Weight"
        disabled={bagEntered}
      />
    </div> -->
    <div class="grid-item">
      <Input
        bind:value={parcelId}
        on:change={(e) => handleParcelInput(e.target.value)}
        label="CN"
        bind:this={inputCn}
        disabled={bagNumber.length === 12 ||
        bagNumber.length === 9 ||
        bagNumber.length === 8
          ? false
          : true}
      />
    </div>
  </div>
  <div class="b-pd-2" />
  <Grid
    {columns}
    {dataSource}
    {tableMetadata}
    on:create-dispute-handler={createDisputeHandler}
  />
</div>

<style>
  .buttons {
    max-width: 180px;
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
  :global(.log.info) {
    --toastBackground: green;
  }
  :global(.log.warn) {
    --toastBackground: red;
  }

  .full-width {
    width: 100%;
  }

  .flex {
    display: flex;
  }

  .justify-content {
    justify-content: right;
  }
</style>
