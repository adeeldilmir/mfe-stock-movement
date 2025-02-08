import * as settingDispute from "./panelSetting.json";

// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import { getUser } from "../../common/utils/utils";

export async function getPanelSetting() {
    return settingDispute;
}

export async function getBag(requestCode) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/${requestCode}`,
        token
    );
}
