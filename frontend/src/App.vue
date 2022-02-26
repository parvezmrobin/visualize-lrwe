<template>
  <div id="nav" v-show="$route.path !== '/bug-localization'">
    <router-link to="/">Home</router-link>
    |
    <router-link to="/bug-localization">Bug Localization</router-link>
    |
    <router-link to="/custom-drawing">Custom Drawing</router-link>
  </div>
  <router-view />

  <LoadingModal />
</template>

<script lang="ts">
import LoadingModal from "@/components/bug-localization/LoadingModal.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  components: { LoadingModal },
});
</script>

<style lang="scss">
$body-bg: #212529 !default;
$body-color: #fff !default;
$enable-negative-margins: true;
@import "~bootstrap/scss/bootstrap";

#nav {
  text-align: center;
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
