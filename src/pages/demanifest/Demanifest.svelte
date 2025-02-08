<script lang="ts">
  import {
    Grid,
    Dropdown,
    Input,
    Dialog,
    Button,
    SpinnerPage,
    AutoComplete,
    Pill,
    Message,
  } from "@swyft-logistics/styleguide";
  import { toast } from "@zerodevx/svelte-toast";
  import { onMount, tick, createEventDispatcher } from "svelte";
  import { DisputeTypes } from "../../common/utils/enums";
  import {
    getColumnsSetting,
    getWareHouseByCode,
    getParcel,
    getBag,
    getManifest,
    getAdministrator,
    updateManifestStatus,
    getLoadingsByManifestId,
  } from "./api";
  import cities from "../../store/cities";
  import {
    checkDuplicateScanEntry,
    findIndexInArray,
    isEqual,
    isTolerated,
    isExists,
    getUser,
    removeDuplicateItemsById,
  } from "../../common/utils/utils";
  import {
    ManifestStatuses,
    LabelPrefixes,
    OtherDisputes,
  } from "../../common/utils/enums";
  import Loading from "../loading/Loading.svelte";
  import Manifest from "../manifest/Manifest.svelte";

  export let progress: any;
  let items: Array<string> = ["Forward", "Return"];
  let parcelId: string = "";
  let journeyType: string = "";
  let dialog: any;
  let dataSource = []; // TODO: Define interace
  let columns;
  let tableMetadata;
  let currentUser;
  let manifestIds = [];
  let manifestInput;
  let originCityDisplayName;
  let originWareHouseDispalyName;
  let destinationCity;
  let productType;
  let serviceType;
  let totalScanned = 0;
  let actualWeight;
  let scannedWeight = 0;
  let disableConfirmDemanifest = true;
  let disableScanningItem = true;
  let disableScanningManifest = false;
  let manifestContent = [];
  let dialogContent;
  let disputedManifestContent = [];
  let manifestRes = {};
  let disputed = [];
  let inputCnBag = null;
  let cityIdHash = {};
  let disputedItem = {
    manifestId: "",
    id: "",
    reason: "",
    comment: "",
    index: null,
  };
  let isDispute = false;
  let showDisputeList = true;
  let loadingData: { count: number; results: Array<any> } | any = {
    count: 0,
    results: [],
  };
  let allowedLocationsIds = [];
  let allLoadings = [];
  const dispatch = createEventDispatcher();

  let showfooter = false;
  let scannedItemData;
  let dialogBodyContent;
  onMount(async () => {
    let columnSetting = await getColumnsSetting();
    columns = columnSetting.columns;
    tableMetadata = columnSetting.tableMetadata;
  });

  function handleRefresh(e) {
    dataSource = [];
    totalScanned = 0;
    scannedWeight = 0;
  }
  function exitHandler(e) {
    totalScanned = 0;
    dataSource = [];
    manifestInput = "";
    manifestIds = [];
    scannedWeight = 0;
    disableScanningItem = true;
    productType = "";
    serviceType = "";
    journeyType = "";
    destinationCity = "";
    actualWeight = "";
    manifestContent = [];
    loadingData = {
      count: 0,
      results: [],
    };
    disputed = [];
    originCityDisplayName = "";
    originWareHouseDispalyName = "";
    currentUser = "";
    disableConfirmDemanifest = true;
    disableScanningManifest = false;
    disputedManifestContent = [];
  }

  function removeHandler(e) {
    const deletedRow = dataSource.splice(e.detail.rowId, 1);
    dataSource = [...dataSource];
    scannedWeight = parseFloat(
      (scannedWeight - deletedRow[0].weight).toFixed(3)
    );

    if (disputedManifestContent && disputedManifestContent[deletedRow[0].id]) {
      console.log("deleted row", disputedManifestContent[deletedRow[0].id]);
      delete disputedManifestContent[deletedRow[0].id];
      totalScanned = totalScanned - 1;
    }

    // mark the item as it is not scanned
    const scannedItemIndex = findIndexInArray(
      manifestContent,
      "id",
      deletedRow[0].id
    );

    if (scannedItemIndex > -1) {
      manifestContent[scannedItemIndex]["scanned"] = false;
    }
  }

  async function onScanParcelHandler(e) {
    let id = e.target.value;
    if (id) {
      id = id.trim();
      if (checkDuplicateScanEntry(dataSource, id)) {
        parcelId = "";
        toast.push("Item Already Scan", { classes: ["error"] });
      } else {
        disableScanningManifest = true;
        try {
          if (id.slice(0, 3) == "BAG" || id.slice(0, 1) == LabelPrefixes.BAGS) {
            const res = await getBag(id);
            if (res.error) {
              if (res.error === `Bag ${id} not found`) {
                toast.push("Invalid Bag Id Entered", { classes: ["error"] });
                parcelId = "";
                return;
              } else {
                throw new Error(res.error);
              }
            }

            const scannedItemIndex = findIndexInArray(
              manifestContent,
              "id",
              id
            );

            if (scannedItemIndex == -1) {

              dialogContent="Message"
              dialogBodyContent=`${parcelId} is not part of the Scanned Manifests.Do you want to proceed?`
              scannedItemData=res;
              dialog.toggle();
              showfooter=true;
              return;
            } else {
              dataSource = [
                {
                  manifestId: manifestContent[scannedItemIndex]["manifestId"],
                  id: res.baggingId,
                  type: "BAG",
                  weight: res.weight,
                  pieces: res.parcelIds.length,
                  rowSpecificButtons1: [
                    { label: "Dispute", action: "create-dispute-handler" },
                  ],
                },
                ...dataSource,
              ];

              dataSource = removeDuplicateItemsById(dataSource);       
              scannedWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
              scannedWeight = parseFloat((scannedWeight).toFixed(3));


              //to Check if parcel is scanned
              manifestContent[scannedItemIndex]["scanned"] = true;

              manifestContent = [...manifestContent];
            }
            totalScanned = totalScanned + 1;
            toast.push(`${parcelId} Scanned`, {classes: ["success"]});
          } else {
            const res = await getParcel(id);

            if (res.error) {
              if (res.error.statusCode === 404) {
                toast.push("Invalid Parcel Id Entered", { classes: ["error"] });
                parcelId = "";
                return;
              } else {
                throw new Error(res.error);
                parcelId = "";
              }
            }
            const scannedItemIndex = findIndexInArray(
              manifestContent,
              "id",
              id
            );

            if (scannedItemIndex == -1) {
              dataSource = [
                {
                  manifestId: "",
                  id: res.id,
                  type: "CN",
                  weight: res.weight,
                  pieces: 1,
                  vendorName: res.vendor.name,
                  originCity: cityIdHash[res.originCityId].name,
                  destinationCity: cityIdHash[res.cityId].name,
                  rowSpecificButtons1: [
                    { label: "Dispute", action: "create-dispute-handler" },
                  ],
                },
                ...dataSource,
              ];
              if(!disputedManifestContent[res.id]){
              disputedManifestContent[res.id] = {
                manifestId: "",
                reason: DisputeTypes.EXCESS_RECEIVED,
              };
            }

              dataSource = removeDuplicateItemsById(dataSource);       
              scannedWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
              scannedWeight = parseFloat((scannedWeight).toFixed(3));
            } else {
              dataSource = [
                {
                  manifestId: manifestContent[scannedItemIndex]["manifestId"],
                  id: res.id,
                  type: "CN",
                  weight: res.weight,
                  pieces: 1,
                  vendorName: res.vendor.name,
                  originCity: cityIdHash[res.originCityId].name,
                  destinationCity: cityIdHash[res.cityId].name,
                  rowSpecificButtons1: [
                    { label: "Dispute", action: "create-dispute-handler" },
                  ],
                },
                ...dataSource,
              ];

              dataSource = removeDuplicateItemsById(dataSource);       
              scannedWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
              scannedWeight = parseFloat((scannedWeight).toFixed(3));

              //to Check if parcel is scanned
              manifestContent[scannedItemIndex]["scanned"] = true;
              manifestContent = [...manifestContent];
            }

            totalScanned = totalScanned + 1;
            toast.push(`${parcelId} Scanned`, {classes: ["success"]});
          }
        } catch (error) {
          toast.push(`${error}`, { classes: ["error"] });
        }

        parcelId = "";
      }
    }

    disableConfirmDemanifest = dataSource.length == 0;
  }

  async function onScanManifestId(e) {
    let id: string = e.target.value;
    if (isExists(id)) {
      id = id.trim();
      try {
        const man = "MAN";
        manifestInput = "";
        if (isEqual(id.slice(0, 3), man)) {
          dispatch("show-loader");
          if (!isEqual(manifestIds.length, 0)) {
            if (isEqual(manifestIds.includes(id), true)) {
              toast.push("Manifest Already Scanned", { classes: ["error"] });
              manifestInput = "";
              dispatch("hide-loader");
              return;
            }
          }
          manifestIds.push(id);
          manifestIds = [...manifestIds];

          let manifest = await getManifest(id);

          if (isEqual(manifest.statusCode, 404)) {
            toast.push("Manifest not found", { classes: ["error"] });
            manifestInput = "";
            manifestIds = manifestIds.filter((item) => item !== id);

            delete manifestRes[id];
            dispatch("hide-loader");
            return;
          }

          if (manifest.error) {
            throw new Error(manifest.error);
          }
          manifestRes[id] = { ...manifest };
          const body = {
            filters: {
              manifestIds: id,
            },
            fields: "destinationCity destinationWarehouse manifestIds",
          };

          if (!isEqual(loadingData["results"].length, 0)) {
            if (
              isEqual(loadingData["results"][0].manifestIds.includes(id), false)
            ) {
              toast.push(`Manifest ${id} is not part of same vehicle`, {
                classes: ["error"],
              });
              manifestInput = "";
              manifestIds = manifestIds.filter((item) => item !== id);

              delete manifestRes[id];
              dispatch("hide-loader");
              return;
            }
          } else {
            loadingData = await getLoadingsByManifestId(body);

            if (isEqual(loadingData["results"].length, 0)) {
              toast.push(
                `Manifest Status (${manifest.currentStatusId}) is incorrect`,
                { classes: ["error"] }
              );
              manifestInput = "";
              manifestIds = manifestIds.filter((item) => item !== id);

              delete manifestRes[id];
              dispatch("hide-loader");
              return;
            }
            if (loadingData.error) {
              throw new Error(manifest.error);
            }
          }
          if (
            !isEqual(
              loadingData["results"][0]["destinationCity"],
              getUser().user.location.cityCode
            ) ||
            !isEqual(
              loadingData["results"][0]["destinationWarehouse"],
              getUser().user.location.warehouseCode
            )
          ) {
            toast.push("Shipment not Unloaded at correct destination", {
              classes: ["error"],
            });
            manifestInput = "";
            manifestIds = manifestIds.filter((item) => item !== id);

            delete manifestRes[id];
            dispatch("hide-loader");
            return;
          }
          if (getUser().user.allowedLocations) {
            allowedLocationsIds = getUser().user.allowedLocations.map(
              (item) => item.cityCode
            );
          }

          if (
            !isEqual(manifestRes[id]["destinationCity"], [
              getUser().user.location.cityCode,
              ...allowedLocationsIds,
            ])
          ) {
            toast.push("Invalid Destination City", { classes: ["error"] });
            manifestInput = "";
            manifestIds = manifestIds.filter((item) => item !== id);

            delete manifestRes[id];
            dispatch("hide-loader");
            return;
          }

          if (
            isEqual(manifestRes[id].currentStatusId, ManifestStatuses.UNLOADED)
          ) {
            disableScanningItem = false;
            disableConfirmDemanifest = false;

            productType = manifestRes[id]["productTypeCode"];
            serviceType = manifestRes[id]["serviceTypeCode"];
            journeyType = manifestRes[id]["journeyTypeCode"];
            actualWeight = manifestRes[id]["weight"];
            let content = manifestRes[id]["content"].map((item) => {
              return {
                ...item,
                manifestId: id,
              };
            });

            manifestContent.push(...content);

            //Geting origin city name from list in svelte store name:city

            $cities.forEach((city) => {
              if (city["cityCode"] == manifestRes[id]["originCity"]) {
                originCityDisplayName = `${city.cityCode}-${city.name}`;
              }

              if (city["cityCode"] == manifestRes[id]["destinationCity"]) {
                destinationCity = `${city.cityCode}-${city.name}`;
              }
            });

            const warehouseRes = getWareHouseByCode(
              manifestRes[id]["originCity"],
              manifestRes[id]["originWarehouse"]
            );

            const adminRes = getAdministrator(manifestRes[id]["sourceId"]);

            const promiseAll = await Promise.all([adminRes, warehouseRes]);
            currentUser = `${promiseAll[0][0].firstName} ${promiseAll[0][0].lastName}`;
            originWareHouseDispalyName = `${promiseAll[1][0].warehouseCode}-${promiseAll[1][0].name}`;

            dispatch("hide-loader");
          } else {
            toast.push(
              `Manifest Status (${manifest.currentStatusId}) is incorrect`,
              {
                classes: ["error"],
              }
            );
            manifestInput = "";
            manifestIds = manifestIds.filter((item) => item !== id);
            delete manifestRes[id];
            dispatch("hide-loader");
            return;
          }
        } else {
          disableScanningManifest = false;
          toast.push("Invalid Manifest Id", { classes: ["error"] });
          manifestInput = "";
          manifestIds = manifestIds.filter((item) => item !== id);
          delete manifestRes[id];
        }
        dispatch("hide-loader");
      } catch (error) {
        console.log("Error", { error });
        disableScanningManifest = false;
        toast.push("Something went wrong", { classes: ["error"] });
        manifestInput = "";
        manifestIds = manifestIds.filter((item) => item !== id);
        delete manifestRes[id];
        dispatch("hide-loader");
      }
    }
  }

  async function onWeightChangeHandler(e) {
    let weight = e.target.value;
    if (isTolerated(Number(weight), actualWeight)) {
      disableConfirmDemanifest = false;
      dataSource = [...manifestContent];
      manifestContent = manifestContent.map((item) => {
        return { ...item, scanned: true };
      });
    } else {
      disableConfirmDemanifest = false;
      scannedWeight = 0;
      toast.push("Weight does not match.Scan parcel/Bag.", {
        classes: ["error"],
      });
    }
  }

  async function onConfirmDemanifestHandler(e) {
    dialogBodyContent="";
    dialogContent="";
    showfooter=false;
    e.preventDefault();
    if (!manifestContent) return;
    manifestContent.forEach((item) => {
      if (!item.scanned) {
        disputedManifestContent[item.id] = {
          manifestId: item.manifestId,
          reason: DisputeTypes.SHORT_RECEIVED,
          comment: disputedManifestContent[item.id]
            ? disputedManifestContent[item.id].comment
            : "",
        };
      } else if (
        item.scanned &&
        disputedManifestContent[item.id] &&
        disputedManifestContent[item.id].reason == DisputeTypes.SHORT_RECEIVED
      ) {
        delete disputedManifestContent[item.id];
      }
    });

    disputedManifestContent = disputedManifestContent;

    if (Object.keys(disputedManifestContent).length) {
      isDispute = false;
      dialogContent = "Disputed Items";
      dialog.toggle();
      return;
    }

    const data = [];
    manifestIds.forEach((id, index) => {
      let disputeManifest = disputed.filter(
        (item) => item.manifestId === id || item.manifestId === ""
      );
      if (index !== 0) {
        disputeManifest =
          disputeManifest.length > 0
            ? disputeManifest.filter(
                (item) => item.reason !== DisputeTypes.EXCESS_RECEIVED
              )
            : [];
      }
      data.push({
        manifestId: id,
        previousStatusId: manifestRes[id].currentStatusId,
        currentStatusId: ManifestStatuses.CLOSED,
        meta: {
          status: ManifestStatuses.CLOSED,
          journeyTypeCode: manifestRes[id].journeyTypeCode,
          originCity: manifestRes[id].originCity,
          originWarehouse: manifestRes[id].originWarehouse,
          destinationCity: manifestRes[id].destinationCity,
          createdBy: getUser().user.email,
          creator: "admin",
          location: {
            cityCode: getUser().user.location.cityCode,
            warehouseCode: getUser().user.location.warehouseCode,
          },
        },
        disputed: [...disputeManifest],
      });
    });
    const payload = [...data];

    dispatch("show-loader");
    await updateManifestStatus(payload);

    dispatch("hide-loader");
    toast.push("Parcel/Bag demanifested Successfully!", {
      classes: ["success"],
    });

    disableScanningItem = true;
    disableConfirmDemanifest = true;
  }

  function createDisputeHandler(e) {
    dialogBodyContent="";
    dialogContent="";
    showDisputeList = true;
    disputedItem = {
      manifestId: "",
      id: "",
      reason: "",
      comment: "",
      index: null,
    };

    // if parcel is not disputed as EXCESS RECEIVED
    disputedItem.id = dataSource[e.detail.rowId].id;
    disputedItem.manifestId = dataSource[e.detail.rowId].manifestId;
    // disputedItem.index = e.detail.rowId;
    if (disputedManifestContent[disputedItem.id]) {
      disputedItem.manifestId = dataSource[e.detail.rowId].manifestId;
      disputedItem.reason = disputedManifestContent[disputedItem.id].reason;
      disputedItem.comment = disputedManifestContent[disputedItem.id].comment;
      if (
        disputedManifestContent[disputedItem.id].reason ==
        DisputeTypes.EXCESS_RECEIVED
      ) {
        showDisputeList = false;
      }
    }
    isDispute = true;
    dialogContent = "Dispute";
    dialog.toggle();
  }

  async function onDisputeFormSubmit(e) {
    e.preventDefault();
    dialogBodyContent="";
    showfooter=false;
    isDispute = false;
    disputedManifestContent[disputedItem.id] = {
      manifestId: disputedItem.manifestId,
      reason: disputedItem.reason,
      comment: disputedItem.comment,
    };

    disputedItem = {
      manifestId: "",
      id: "",
      reason: "",
      comment: "",
      index: null,
    };
    dialog.toggle();
  }
  async function onMarkDisputetSubmitHandler(e) {
    e.preventDefault();    
    dialogBodyContent="";
    showfooter=false;
    toast.push("Parcel/Bag marked disputed successfully", {
      classes: ["success"],
    });

    await tick();

    Object.keys(disputedManifestContent).forEach((key) => {
      disputed.push({
        manifestId: disputedManifestContent[key].manifestId,
        id: key,
        reason: disputedManifestContent[key].reason,
        description: disputedManifestContent[key].comment,
      });
    });
    disputedManifestContent = [];
    manifestContent = [];
    dialogContent = "";
    dialog.toggle();
    onConfirmDemanifestHandler(e);
  }

  function scanItem(data) {
    if (data.baggingId) {
      dataSource = [
        {
          manifestId: "",
          id: data.baggingId,
          type: "BAG",
          weight: data.weight,
          pieces: data.parcelIds.length,
          rowSpecificButtons1: [
            { label: "Dispute", action: "create-dispute-handler" },
          ],
        },
        ...dataSource,
      ];
      if(!disputedManifestContent[data.baggingId]){    
      disputedManifestContent[data.baggingId] = {
        manifestId: "",
        reason: DisputeTypes.EXCESS_RECEIVED,
      };
    }
      dataSource = removeDuplicateItemsById(dataSource);       
      scannedWeight = dataSource.reduce((sum,item) => sum + item.weight, 0);
      scannedWeight = parseFloat((scannedWeight).toFixed(3));

    }
  }

  function onProccedClickHandler(e) {
    dialogBodyContent=""
    showfooter=false;
    scanItem(scannedItemData)
    dialog.toggle();
    showfooter = false;
    toast.push(`${parcelId} Scanned`, {classes: ["success"]});
    parcelId="";
  }

  function onNoClickHandler(e) {
    parcelId="";
    dialogBodyContent="";
    showfooter = false;
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

<!-- svelte-ignore non-top-level-reactive-declaration -->
<div>De-manifest</div>
<div style="--modal-body-max-height:300px; --modal-body-min-height:130px">
  <Dialog bind:this={dialog} header={dialogContent}>
    <div slot="dialog-content"  class="full-width">
    {#if dialogBodyContent}   
          {#each dialogBodyContent.split(",") as error}
            <Message message={error} type="error" open={true} />
          {/each}
     {:else} 
      <div>
        {#if Object.keys(disputedManifestContent).length}
          <div class="grid-container">
            <div class="grid-item">CN/Bag</div>
            <div>Manifest Id</div>
            <div class="grid-item">Reason</div>
            <div class="grid-item">Comment</div>
          </div>
        {/if}
        {#if !isDispute}
          {#each Object.keys(disputedManifestContent) as item}
            <div class="grid-container">
              <div class="grid-item">
                {item}
              </div>
              <div class="grid-item">
                {disputedManifestContent[item]["manifestId"]}
              </div>
              <div class="grid-item">
                {disputedManifestContent[item]["reason"]}
              </div>
              <div class="grid-item">
                <Input
                  bind:value={disputedManifestContent[item]["comment"]}
                  placeholder="Comment"
                />
              </div>
            </div>
          {/each}
        {:else}
          <form on:submit={onDisputeFormSubmit}>
            <div class="grid-container">
              <div class="grid-item">
                {disputedItem.id}
              </div>
              <div class="grid-item">
                {disputedItem.manifestId}
              </div>
              <div class="grid-item">
                {#if showDisputeList}
                  <AutoComplete
                    bind:value={disputedItem.reason}
                    placeholder="Select Reason"
                    displayProperty="name"
                    valueProperty="id"
                    items={Object.keys(OtherDisputes)
                      .filter((disputes) => {
                        if (disputedItem.id.startsWith("B")) {
                          return disputes === "DAMAGED";
                        } else {
                          return true;
                        }
                      })
                      .map((item) => {
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
      {/if}
    </div>
    <div class="full-width" slot="dialog-footer">
     
          {#if showfooter}
          <div class="flex display-flex justify-content-space-between padding">
            <div>
              <Button label="No" on:click={onNoClickHandler} />
            </div>
            <div>
              <Button
                class="error"
                label="Proceed"
                on:click={onProccedClickHandler}
              />
            </div>
          </div>  
          {:else}
          <div class="flex justify-content">
            <div>
            {#if !isDispute && Object.keys(disputedManifestContent).length}
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
       {/if}
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
              label="Journey"
              placeholder="Journey Type"
              required
              disabled
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={originCityDisplayName}
              label="Origin City"
              placeholder="Origin City"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={originWareHouseDispalyName}
              label="Origin Hub"
              placeholder="Origin Hub"
              readonly
              disabled
              required
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={destinationCity}
              label="Destination City"
              placeholder="Destination City"
              required
              disabled
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={productType}
              label="Product Type"
              placeholder="Product Type"
              required
              disabled
            />
          </div>
          <div class="grid-item">
            <Input
              bind:value={serviceType}
              label="Service"
              placeholder="Service"
              required
              disabled
            />
          </div>
    
          <div class="grid-item">
            <Input
              bind:value={currentUser}
              label="Created by"
              placeholder="Created by"
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
                    label="Demanifest"
                    testId="Demanifest"
                    type="submit"
                    disabled={dataSource.length === 0 || disableConfirmDemanifest}
                    on:click={onConfirmDemanifestHandler}
                  />
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
            <h3 class="ft-large">{scannedWeight}</h3>
            <p class="ft-bold">Total Weight(KG)</p>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="grid-container">
    <div class="grid-item">
      <Input
        bind:value={manifestInput}
        label="Manifest ID"
        placeholder="Scan manifestIds"
        on:change={onScanManifestId}
        disabled={disableScanningManifest}
      />
      {#if manifestIds.length > 0}
        {#each manifestIds as manifestId}
          <Pill label={manifestId} item={manifestId} />
        {/each}
      {/if}
    </div>

    <div class="grid-item">
      <Input
        bind:value={parcelId}
        bind:this={inputCnBag}
        label="CN/Bag"
        placeholder="Scan ID"
        on:change={onScanParcelHandler}
        disabled={disableScanningItem}
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

  .flex {
    display: flex;
  }

  .justify-content {
    justify-content: right;
  }

  .justify-content-space-between {
    justify-content: space-between;
  }
  .display-flex {
    display: flex;
    flex-direction: row;
  }
  .padding {
    padding: 0px 10px;
  }
</style>
