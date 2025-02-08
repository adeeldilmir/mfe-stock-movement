// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import { writable } from "svelte/store";
import type { ICity } from "../common/interfaces/ICity";
import type { IProductTypes } from "../common/interfaces/IProductTypes";
import { getUser } from "../common/utils/utils";

const { subscribe, set, update } = writable([]);

const addItem = (proudcttype: IProductTypes) =>
    update((proudcttypes) => {
        return [...proudcttypes, proudcttype];
    });

const reset = () => {
    set([]);
};

const init = async (storeInitializer: {
    url: string;
    items?: Array<IProductTypes>;
}) => {
    let items = storeInitializer.items;
    if (storeInitializer.url) {
        const adminData = getUser();
        const token = adminData.id;
        const res = await authenticatedFetchLegacy(storeInitializer.url, token);
        items = res.producttypes;
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
