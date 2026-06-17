export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  const isAdminRoute = to.path.startsWith('/admin')
  const isPublicAdminRoute = to.path === '/admin/login' || to.path === '/admin/confirm'

  if (isAdminRoute && !isPublicAdminRoute && !user.value) {
    return navigateTo('/admin/login')
  }
})
