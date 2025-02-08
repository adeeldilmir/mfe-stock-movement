export enum Statuses {
    AT_SWYFT_WAREHOUSE = "5dd7fa20dcfa9600152cc2d8",
    DEMANIFESTED = "6332de9d5856539e1e5c99d7",
    CANCELLED = "5dd7fa20dcfa9600152cc2de",
}

export enum ServiceTypes {
    EXPRESS = "Express",
    OVERNIGHT = "Overnight",
    OVERLAND = "Overland",
}

export enum DisputeTypes {
    EXCESS_RECEIVED = "Excess received",
    SHORT_RECEIVED = "Short received",
}

export enum BaggingStatuses {
    NEW = "New",
    MANIFESTED = "Manifested",
    LOADED = "Loaded",
    UNLOADED = "Unloaded",
    DEMANIFESTED = "Demanifested",
    DISPUTED = "Disputed",
    CLOSED = "Closed",
}

export enum ManifestStatuses {
    NEW = "New",
    LOADED = "Loaded",
    UNLOADED = "Unloaded",
    CLOSED = "Closed",
}

export enum LoadingStatuses {
    NEW = "New",
    CLOSED = "Closed",
}

export enum JourneyType {
    FORWARD = "Forward",
    RETURN = "Return",
}

export enum AuditLogTypes {
    ORIGIN_CITY_CHANGE = "origin-city-change",
}
export enum LabelPrefixes {
    BAGS = "B",
    VEHICLES = "V",
}

export enum ShipperAdviceEnum {
    RTV = "Returned to Vendor",
    RFR = "Request for Reattempt",
}

export enum ShipperAdviceApprovalStatusEnum {
    APPROVED = "At Swyft's Warehouse",
    REJECTED = "Not Approved",
}

export enum ShipperAdviceStatusEnum {
    PENDING = "pending",
    COMPLETED = "completed",
}

export enum OtherDisputes {
    DAMAGED = "Damaged",
    MISSING_ARTICLE = "Missing Article",
}
