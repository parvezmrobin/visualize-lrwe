/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

import { ComponentCustomProperties } from 'vue'
import { Store } from "vuex";

declare module '@vue/runtime-core' {
  import { State } from "@/store";

  interface ComponentCustomProperties {
    $store: Store<State>
  }
}
