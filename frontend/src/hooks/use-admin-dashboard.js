import { useEffect, useState } from 'react'
import { fetchAdminOverview, fetchAdminUsers } from '../services/admin.service'

function createInitialState() {
  return {
    overview: null,
    users: [],
    pagination: null,
    isLoading: true,
    errorMessage: '',
  }
}

export function useAdminDashboard(filters) {
  const [state, setState] = useState(createInitialState)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadAdminDashboard() {
      setState((previousState) => ({
        ...previousState,
        isLoading: true,
        errorMessage: '',
      }))

      try {
        const [overview, usersResult] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminUsers(filters),
        ])

        if (!isMounted) {
          return
        }

        setState({
          overview,
          users: usersResult.users,
          pagination: usersResult.pagination,
          isLoading: false,
          errorMessage: '',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState((previousState) => ({
          ...previousState,
          users: [],
          pagination: null,
          isLoading: false,
          errorMessage: error.message,
        }))
      }
    }

    loadAdminDashboard()

    return () => {
      isMounted = false
    }
  }, [filters, reloadKey])

  const reload = () => {
    setReloadKey((currentKey) => currentKey + 1)
  }

  return {
    ...state,
    reload,
  }
}
