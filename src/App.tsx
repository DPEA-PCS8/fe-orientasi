import { ThemeProvider, CssBaseline } from '@mui/material';
import ojkTheme from './styles/theme';
import Layout from './components/Layout'
import UserList from './pages/UserList'

function App() {
  return (
    <ThemeProvider theme={ojkTheme}>
      <CssBaseline />
      <Layout
        pageTitle="User Management"
        pageDescription="Kelola data pengguna yang terdaftar dalam sistem"
        breadcrumbs={[{ label: 'User Management' }]}
      >
        <UserList />
      </Layout>
    </ThemeProvider>
  )
}

export default App
