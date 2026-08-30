import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_YOUR_PROJECT_URL;
const supabaseKey = import.meta.env.VITE_YOUR_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase
export const testConnection = async () => {
  const { data, error } = await supabase
    .from('Profiles')
    .select('*')

  //console.log('data:', data)
  //console.log('error:', error)
}