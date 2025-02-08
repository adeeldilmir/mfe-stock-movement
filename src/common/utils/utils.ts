import { statusesRepo } from "../../store";
import {
    ShipperAdviceApprovalStatusEnum,
    ShipperAdviceEnum,
    ShipperAdviceStatusEnum,
    JourneyType,
} from "./enums";
import {
    SHIPPER_ADVICE_WAIT_TIME,
    SHIPPER_ADVICE_DAYS_TO_SKIP,
} from "./constants";
import moment from "moment";

export function getUser() {
    return JSON.parse(localStorage.getItem("pc_admin_data"));
}

export function hasItems(items) {
    return items > 0;
}

export function checkDuplicateScanEntry(dataSource, id) {
    const itemScanned = dataSource.find((item) => item.id == id);
    return itemScanned && true;
}
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}
export function findIndexInArray(items, prop, value) {
    return items.findIndex((item) => item[prop] == value);
}

export function isEqual(a, b) {
    if (Array.isArray(b)) {
        return b.includes(a);
    }
    return a == b;
}

export function isTolerated(a: number, b: number) {
    if (a - b > 0 && a - b < 1) {
        return true;
    } else if (b - a > 0 && b - a < 1) {
        return true;
    } else if (a === b) {
        return true;
    } else {
        return false;
    }
}

export function maxScanLimit(param: number) {
    if (param === 50) {
        return true;
    } else {
        return false;
    }
}
export function isExists(param) {
    return param ? true : false;
}

export function validateRTVChecks(parcel, journey = JourneyType.RETURN) {
    const statuses = {};
    statusesRepo.subscribe((data) => {
        data.forEach((x) => (statuses[x.key] = x.id));
    });

    //Normal Rtv flow
    if (
        journey == JourneyType.RETURN &&
        ((parcel.currentStatusId == statuses["at-swyft-warehouse"] &&
            parcel.previousStatusId == statuses["returned"]) ||
            (parcel.currentStatusId == statuses["at-swyft-warehouse"] &&
                parcel.previousStatusId == statuses["return-in-progress"]) ||
            parcel.currentStatusId == statuses["returned-by-vendor"] ||
            parcel.currentStatusId == statuses["returned-by-admin"])
    ) {
        // check 36 hours cancel time if shipper advise is not created
        if (
            parcel.currentStatusId == statuses["at-swyft-warehouse"] &&
            parcel.previousStatusId == statuses["returned"]
        ) {
            const parcelStatus = parcel.parcelStatuses;

            const cancelStatusData = parcelStatus[parcelStatus.length - 2];

            const shipperAdvice = parcel.shipperAdviceRelation.find(
                (shipperAdvice) =>
                    moment(shipperAdvice.createdAt).isSameOrAfter(
                        cancelStatusData.createdAt
                    )
            );

            // check if shipper advice is created after cancel status
            if (shipperAdvice) {
                if (shipperAdvice.status == ShipperAdviceStatusEnum.PENDING) {
                    return `Shipper Advice Pending from Admin: ${parcel.id}`;
                } else if (
                    shipperAdvice.requestedStatus == ShipperAdviceEnum.RFR &&
                    shipperAdvice.approvalStatus ==
                        ShipperAdviceApprovalStatusEnum.APPROVED
                ) {
                    return `Shipper Advice: Reattempt is approved:  ${parcel.id}`;
                }
            } else if (checkCancelTime(cancelStatusData.createdAt) > 0) {
                let dispatchCount = parcel.parcelStatuses.filter((status) => {
                    return status.statusRepositoryId === statuses["dispatched"];
                });

                let attemptCount = dispatchCount.length;
                let reattemptsAllowed = parcel.allowedReattemptsCount
                    ? parcel.allowedReattemptsCount
                    : parcel.vendor.allowedReattempts;

                const attemptsLeft =
                    reattemptsAllowed - attemptCount === 0 ? false : true;

                if (attemptsLeft) {
                    return `Shipper Advice Pending from Vendor: ${parcel.id}`;
                }
            }
        }
        return "";
    } else {
        //Debagged and demanifested RTV flow or any other status
        if (
            parcel.currentStatusId == statuses["at-swyft-warehouse"] &&
            (parcel.previousStatusId == statuses["Debagged"] ||
                parcel.previousStatusId == statuses["Demanifested"] ||
                parcel.previousStatusId == statuses["Disputed"] ||
                parcel.previousStatusId == statuses["parcel-picked-up"] ||
                parcel.previousStatusId == statuses["parcel_marked_reattempt"])
        ) {
            const cancelledStatus = parcel.parcelStatuses
                .filter(
                    (status) =>
                        status.statusRepositoryId == statuses["returned"]
                )
                .pop();

            if (cancelledStatus) {
                // check shipper advise is created
                const shipperAdvice = parcel.shipperAdviceRelation.find(
                    (shipperAdvice) =>
                        moment(shipperAdvice.createdAt).isSameOrAfter(
                            cancelledStatus.createdAt
                        )
                );

                if (shipperAdvice) {
                    if (
                        shipperAdvice.status == ShipperAdviceStatusEnum.PENDING
                    ) {
                        return `Shipper Advice Pending from Admin: ${parcel.id}`;
                    } else if (
                        shipperAdvice.requestedStatus ==
                            ShipperAdviceEnum.RFR &&
                        shipperAdvice.approvalStatus ==
                            ShipperAdviceApprovalStatusEnum.APPROVED
                    ) {
                        if (journey == JourneyType.FORWARD) {
                            return "";
                        }
                        return `Shipper Advice: Reattempt is approved: ${parcel.id}`;
                    }
                }
                // check 36 hours cancel time if shipper advise is not created
                else if (
                    checkCancelTime(cancelledStatus.createdAt) > 0 &&
                    journey == JourneyType.RETURN
                ) {
                    let dispatchCount = parcel
                        .parcelStatuses()
                        .filter((status) => {
                            return (
                                status.statusRepositoryId ===
                                statuses["dispatched"]
                            );
                        });
                    let attemptCount = dispatchCount.length;
                    let reattemptsAllowed = parcel.allowedReattemptsCount
                        ? parcel.allowedReattemptsCount
                        : parcel.vendor.allowedReattempts;

                    const attemptsLeft =
                        reattemptsAllowed - attemptCount === 0 ? false : true;

                    if (attemptsLeft) {
                        return `Shipper Advice Pending from Vendor: ${parcel.id}`;
                    }
                }
                if (journey == JourneyType.RETURN) {
                    return "";
                }
            } else if (journey == JourneyType.FORWARD) {
                return "";
            }
        }

        // In case of any other status
        return `Parcel not at required status: ${parcel.id}`;
    }
}

function checkCancelTime(cancelTime) {
    let daysInBetween = enumerateDaysBetweenDates(
        moment(cancelTime).add(5, "hours"),
        moment(cancelTime).add(SHIPPER_ADVICE_WAIT_TIME + 5, "hours")
    );

    if (daysInBetween.includes(0)) {
        return (
            SHIPPER_ADVICE_WAIT_TIME +
            24 * SHIPPER_ADVICE_DAYS_TO_SKIP -
            moment()
                .add(5, "hours")
                .diff(moment(cancelTime).add(5, "hours"), "hours")
        );
    } else {
        return (
            SHIPPER_ADVICE_WAIT_TIME -
            moment()
                .add(5, "hours")
                .diff(moment(cancelTime).add(5, "hours"), "hours")
        );
    }
}

function enumerateDaysBetweenDates(startDate, endDate) {
    let now = startDate.startOf("day"),
        dates = [];

    while (now.isSameOrBefore(endDate.endOf("day"))) {
        dates.push(now.day());
        now.add(1, "days");
    }
    return dates;
}

export function removeDuplicateItemsById(arr) {
    const ids = arr.map((o) => o.id);
    return arr.filter(({ id }, index) => !ids.includes(id, index + 1));
}
