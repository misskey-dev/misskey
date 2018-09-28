<template>
<button
  class="mk-mute-button"
  :class="{ active: user.isMuted }"
  @click="onClick">
  <span v-if="!user.isMuted">%fa:eye-slash% %i18n:@mute%</span>
  <span v-else>%fa:eye% %i18n:@unmute%</span>
</button>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  methods: {
    onClick() {
      if (!this.user.isMuted) {
        this.mute();
      } else {
        this.unmute();
      }
    },
    mute() {
      (this as any).api('mute/create', { userId: this.user.id})
        .then(() => { this.user.isMuted = true })
        .catch(() => { alert('error')})
    },
    unmute() {
      (this as any).api('mute/delete', { userId: this.user.id })
        .then(() => { this.user.isMuted = false })
        .catch(() => { alert('error') })
    }
  },
})
</script>


<style lang="stylus" scoped>


.mk-mute-button
  display block
  user-select none
  cursor pointer
  padding 0 16px
  margin 0
  min-width 100px
  line-height 36px
  font-size 14px
  font-weight bold
  color var(--primary)
  background transparent
  outline none
  border solid 1px var(--primary)
  border-radius 36px

  &:hover
    background var(--primaryAlpha01)

  &:active
    background var(--primaryAlpha02)

  &.active
    color var(--primaryForeground)
    background var(--primary)

    &:hover
      background var(--primaryLighten10)
      border-color var(--primaryLighten10)
    &:active
      background var(--primaryDarken10)
      border-color var(--primaryDarken10)

</style>
