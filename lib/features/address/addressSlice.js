import { createSlice } from '@reduxjs/toolkit'

// Helper to normalize backend Address objects and frontend form objects
export function normalizeAddress(addr) {
    if (!addr) return null
    return {
        id: String(addr.id || ''),
        userId: String(addr.userId || ''),
        // Label / title (Home, Work, Other)
        label: addr.label || addr.title || 'Home',
        title: addr.label || addr.title || 'Home',
        // Full Name
        fullName: addr.fullName || addr.name || '',
        name: addr.fullName || addr.name || '',
        // Phone Number
        phoneNumber: addr.phoneNumber || addr.phone || '',
        phone: addr.phoneNumber || addr.phone || '',
        // Email Address
        emailAddress: addr.emailAddress || addr.email || '',
        email: addr.emailAddress || addr.email || '',
        // Street Address / Address Line
        addressLine: addr.addressLine || addr.street || '',
        street: addr.addressLine || addr.street || '',
        // City, State, Country
        city: addr.city || '',
        state: addr.state || '',
        country: addr.country || 'United States',
        // Postal Code / ZIP
        postalCode: addr.postalCode || addr.zip || '',
        zip: addr.postalCode || addr.zip || '',
        // Default flag
        isDefault: Boolean(addr.isDefault),
        createdAt: addr.createdAt || new Date().toISOString(),
        updatedAt: addr.updatedAt || new Date().toISOString(),
    }
}

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [],
        loading: false,
        error: null,
        fetched: false,
    },
    reducers: {
        setAddresses: (state, action) => {
            const rawList = Array.isArray(action.payload) ? action.payload : []
            state.list = rawList.map(normalizeAddress).filter(Boolean)
            state.fetched = true
            state.loading = false
            state.error = null
        },
        addAddress: (state, action) => {
            const normalized = normalizeAddress({
                id: action.payload?.id || `addr_${Date.now()}`,
                ...action.payload,
            })
            if (normalized.isDefault) {
                state.list.forEach(addr => { addr.isDefault = false })
            }
            state.list.push(normalized)
        },
        updateAddress: (state, action) => {
            const normalized = normalizeAddress(action.payload)
            const index = state.list.findIndex(item => String(item.id) === String(normalized.id))
            if (index !== -1) {
                if (normalized.isDefault) {
                    state.list.forEach(addr => { addr.isDefault = false })
                }
                state.list[index] = { ...state.list[index], ...normalized }
            }
        },
        deleteAddress: (state, action) => {
            state.list = state.list.filter(item => String(item.id) !== String(action.payload))
        },
        setDefaultAddress: (state, action) => {
            state.list.forEach(addr => {
                addr.isDefault = (String(addr.id) === String(action.payload))
            })
        },
        setAddressLoading: (state, action) => {
            state.loading = Boolean(action.payload)
        },
        setAddressError: (state, action) => {
            state.error = action.payload
            state.loading = false
        }
    }
})

export const {
    setAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    setAddressLoading,
    setAddressError
} = addressSlice.actions

export default addressSlice.reducer