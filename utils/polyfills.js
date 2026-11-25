if (typeof global !== 'undefined' && !global.localStorage) {
    const memStore = {};
    global.localStorage = {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(memStore, k) ? memStore[k] : null),
        setItem: (k, v) => { memStore[k] = String(v); },
        removeItem: (k) => { delete memStore[k]; },
        clear: () => {
            Object.keys(memStore).forEach((k) => delete memStore[k]);
        },
    };
}
