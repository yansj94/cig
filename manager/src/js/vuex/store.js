import Vue from "vue";
import Vuex from "vuex";
import common from "./store/common";
import userInfo from "./store/userinfo";

import depInfo from "./store/depinfo";
import insInfo from "./store/insinfo";
import insCode from "./store/inscode";
import insList from "./store/inslist";
import email from "./store/email";


Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        common,
        userInfo,
        depInfo,
        insInfo,
        insCode,
        insList,
        email,
    }
});
