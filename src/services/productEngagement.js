import { supabase } from './supabase'
import { isDevSessionActive } from './devAuth'
import { isUuid } from './validation'

export async function getProductEngagement(product, recordView = true) {
  if (!product) return { views: 0, saves: 0 }
  if (isDevSessionActive() || !isUuid(product.id)) {
    return {
      views: Number(product.views || 0),
      saves: Number(product.favorite_count || product.favoriteCount || 0),
    }
  }

  const { data, error } = await supabase.rpc('get_product_engagement', {
    p_product_id: product.id,
    p_record_view: recordView,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return { views: Number(row?.view_count || 0), saves: Number(row?.favorite_count || 0) }
}
