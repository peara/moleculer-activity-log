'use strict';

module.exports = {
    name: 'admin-property',

    settings: {
        case: 'create'
    },

    actions: {
        showFullLog: {
            params: {
                id: 'number'
            },
            handler(ctx) {
                switch (this.settings.case) {
                case 'create': {
                    return {
                        id: 1,
                        name: {
                            en: 'Fort'
                        }
                    };
                }
                case 'update': {
                    const properties = {
                        1: {
                            id: 1,
                            name: {
                                en: 'Citadel'
                            }
                        },
                        5: {
                            id: 5,
                            name: {
                                en: 'Empty'
                            }
                        }
                    };
                    return properties[ctx.params.id];
                }
                case 'list': {
                    const properties = {
                        5: {
                            id: 5,
                            name: {
                                en: 'Empty'
                            }
                        },
                        6: {
                            id: 6,
                            name: {
                                en: 'Blank'
                            }
                        },
                        7: {
                            id: 7,
                            name: {
                                en: 'Void'
                            }
                        }
                    };
                    return properties[ctx.params.id];
                }
                default:
                    return {};
                }
            }
        },

        changeCase: {
            params: {
                case: 'string'
            },
            handler(ctx) {
                this.settings.case = ctx.params.case;
            }
        }
    }
};
