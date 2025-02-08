// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import { writable } from "svelte/store";
import type { IDriver } from "../common/interfaces/IDriver";
import { getUser } from "../common/utils/utils";

const { subscribe, set, update } = writable([]);

const addItem = (driver: IDriver) =>
    update((drivers) => {
        return [...drivers, driver];
    });

const reset = () => {
    set([]);
};

const init = async (storeInitializer: {
    url: string;
    items?: Array<IDriver>;
}) => {
    let items = storeInitializer.items;
    if (storeInitializer.url) {
        const adminData = getUser();
        const token = adminData.id;
        items = await authenticatedFetchLegacy(storeInitializer.url, token);
    }
    set(items || []);
};

export default {
    init,
    set,
    subscribe,
    addItem,
    reset,
};
