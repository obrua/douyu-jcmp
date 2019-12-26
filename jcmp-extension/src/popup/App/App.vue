<template>
  <div class="obrua-container">
    <div class="obrua-header">
      <div class="carousel">
        <el-carousel height="120px" arrow="never" direction="vertical" :interval="4500">
          <el-carousel-item>
            <h1 class="name">{{ $root.appDetails.name }}</h1>
            <h4 style="text-align: center;">
              <el-link
                type="warning"
                href="https://www.obrua.com/"
                target="_blank"
                :underline="false"
              >by Obrua.com</el-link>
            </h4>
          </el-carousel-item>
          <el-carousel-item>
            <h1 class="version">v{{ $root.appDetails.version }}</h1>
            <h4 style="text-align: center;">
              <el-link
                type="warning"
                href="https://www.obrua.com/"
                target="_blank"
                :underline="false"
              >by Obrua.com</el-link>
            </h4>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>
    <div class="obrua-mian">
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "app",
  components: {
  },
  data() {
    return {
      tab_activeName: "index"
    };
  },
  created() {},
  mounted() {
    let that = this;
  },
  methods: {
    tab_handleClick(tab, event) {
      console.debug(tab, event);
    }
  }
};
</script>

<style lang="scss">
html,
body,
#app {
  height: 100%;
  width: 100%;
}

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.bg-bule {
  background: #47b0f9;
}
.bg-suss {
  background: #86e22a;
}
.bg-err {
  background: #ef0036;
}
.el-message {
  min-width: 250px;
  width: 250px;
}

.el-message-box {
  width: 250px;
}
</style>

<style lang="scss" scoped>
body::-webkit-scrollbar {
  display: none;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: #f5f5f5;
}
::-webkit-scrollbar-track {
  display: none;
}
::-webkit-scrollbar-thumb {
  background-color: #88a8c62b;
  border-radius: 2em;
}

.obrua-container {
  display: flex;
  flex-direction: column;
  width: 300px;
  min-height: 300px;
  max-height: 550px;
  overflow: auto;
  margin-bottom: 10px;
  .obrua-header {
    display: flex;
    flex-direction: column;
    .carousel {
      .version {
        color: #fff;
        font-size: 40px;
        text-align: center;
        margin-top: 30px;
      }

      .name {
        @extend .version;
      }

      .el-carousel__item:nth-child(2n) {
        background-color: #3e92cc;
      }

      .el-carousel__item:nth-child(2n + 1) {
        background-color: #3e92cc;
      }
    }
  }
  .obrua-mian {
    display: flex;
    margin: 0 8px;
  }
}
</style>
