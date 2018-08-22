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
@import '~const.styl'

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
  color $theme-color
  background transparent
  outline none
  border solid 1px $theme-color
  border-radius 36px

  &:hover
    background rgba($theme-color, 0.1)

  &:active
    background rgba($theme-color, 0.2)

  &.active
    color $theme-color-foreground
    background $theme-color

    &:hover
      background lighten($theme-color, 10%)
      border-color lighten($theme-color, 10%)
    &:active
      background darken($theme-color, 10%)
      border-color darken($theme-color, 10%)

</style>
