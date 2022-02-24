<template>
  <div id="nav" v-show="$route.path !== '/bug-localization'">
    <router-link to="/">Home</router-link> |
    <router-link to="/bug-localization">Bug Localization</router-link> |
    <router-link to="/custom-drawing">Custom Drawing</router-link>
  </div>
  <router-view />
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

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

input,
select {
  border: none;
  border-bottom: 1px solid slategrey;
}

input[type="number"],
input[type="text"] {
  width: 80px;
}
</style>
