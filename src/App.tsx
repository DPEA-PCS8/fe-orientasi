import { ThemeProvider, CssBaseline } from '@mui/material';
import ojkTheme from './styles/theme';
import Layout from './components/Layout'
import UserList from './pages/UserList'

function App() {
  return (
    <ThemeProvider theme={ojkTheme}>
      <CssBaseline />
      <Layout>
        <UserList />
      </Layout>
    </ThemeProvider>
  )
}

export default App
