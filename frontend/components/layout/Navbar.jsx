"use client"
import { useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { useRouter } from "next/router"
import { Fragment } from "react"
import { Menu, Transition } from "@headlessui/react"
import Hashids from "hashids"
import UserAvatar from "../ui/UserAvatar"
import useSearch from "../../hooks/useSearch"
import CheckPermission from "../ui/CkeckPermission";
import useEnhancedNotifications from "../../hooks/useEnhancedNotifications";

import {
  BellIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon,
  BuildingOfficeIcon, UserIcon, UserGroupIcon,
  Cog6ToothIcon,ArrowRightOnRectangleIcon,BuildingStorefrontIcon,
  CalculatorIcon, EyeIcon, ShieldCheckIcon,
} from "@heroicons/react/24/outline"

const Navbar = ({ onSidebarToggle }) => {
  const router = useRouter()
  const hashids = new Hashids("your-salt-string", 6)
  const { user, logout } = useAuth()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { searchQuery, searchResults, searchLoading, totalResults, updateSearchQuery, clearSearch } = useSearch("", 300, user?.permissions)

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    refetch: refetchNotifications,
  } = useEnhancedNotifications();

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchFocused(false)
    }
  }

  const handleClearSearch = () => {
    clearSearch()
    setIsSearchFocused(false)
  }

  const handleSuggestionClick = (item, type) => {
    clearSearch()
    setIsSearchFocused(false)
    switch (type) {
      case "property":
        router.push(`/properties/${hashids.encode(item.id)}`)
        break
      case "agent":
        router.push(`/agents/${hashids.encode(item.id)}`)
        break
      case "manager":
        router.push(`/managers/${hashids.encode(item.id)}`)
        break
      case "brokerage":
        router.push(`/brokerages/${hashids.encode(item.id)}`)
        break
      case "estimate":
        router.push(`/estimates/${hashids.encode(item.id)}`)
        break
      case "visit":
        router.push(`/visits/${hashids.encode(item.id)}`)
        break
      case "admin":
        router.push(`/admins/${hashids.encode(item.id)}`)
        break
      default:
        break
    }
  }

  const handleViewAllClick = (type) => {
    clearSearch()
    setIsSearchFocused(false)
    switch (type) {
      case "properties":
        router.push("/properties")
        break
      case "agents":
        router.push("/agents")
        break
      case "managers":
        router.push("/managers")
        break
      case "brokerages":
        router.push("/brokerages")
        break
      case "estimates":
        router.push("/estimates")
        break
      case "visits":
        router.push("/visits")
        break
      case "admins":
        router.push("/admins")
        break
      default:
        break
    }
  }

  const getSearchIcon = (type) => {
    switch (type) {
      case "property":
        return BuildingOfficeIcon
      case "agent":
        return UserIcon
      case "manager":
        return UserGroupIcon
      case "brokerage":
        return BuildingStorefrontIcon
      case "estimate":
        return CalculatorIcon
      case "visit":
        return EyeIcon
      case "admin":
        return ShieldCheckIcon
      default:
        return BuildingOfficeIcon
    }
  }

  const getSearchColor = (type) => {
    switch (type) {
      case "property":
        return "text-blue-600 bg-blue-50"
      case "agent":
        return "text-green-600 bg-green-50"
      case "manager":
        return "text-purple-600 bg-purple-50"
      case "brokerage":
        return "text-yellow-600 bg-yellow-50"
      case "estimate":
        return "text-indigo-600 bg-indigo-50"
      case "visit":
        return "text-pink-600 bg-pink-50"
      case "admin":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:ml-0">
        {/* Left Section - Menu Button Only */}
        <div className="flex items-center">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>

        {/* Center Section - Search Field */}
        <div className="flex-1 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-4 sm:mx-8 lg:ml-4 xl:ml-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <label htmlFor="search" className="sr-only">
              Search properties, agents, or managers
            </label>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 transition-colors duration-200 ${isSearchFocused ? "text-primary-600" : "text-gray-400"}`}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                id="search"
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 150)
                }}
                className={`block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white text-sm transition-all duration-200 ${isSearchFocused
                  ? "border-primary-500 ring-2 ring-primary-500 bg-white shadow-lg"
                  : "hover:border-gray-300 hover:bg-white"
                  }`}
                placeholder="Search properties, agents, managers..."
                type="text"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchFocused && (searchQuery.trim() || searchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                  </div>
                ) : totalResults > 0 ? (
                  <div className="space-y-4">

                    {/* Properties Results */}
                    {searchResults.properties?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                            Properties ({searchResults.properties.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("properties")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.properties.map((property) => {
                            const Icon = getSearchIcon("property")
                            return (
                              <button
                                key={property.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(property, "property")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("property")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{property.property_name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {property.property_code} • {property.city} • ₹
                                      {Number.parseFloat(property.full_deal_amount || 0).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Agents Results */}
                    {searchResults.agents?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-green-600" />
                            Agents ({searchResults.agents.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("agents")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.agents.map((agent) => {
                            const Icon = getSearchIcon("agent")
                            return (
                              <button
                                key={agent.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(agent, "agent")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("agent")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{agent.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {agent.user_code} • {agent.email} • {agent.agent_type || "Agent"}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Managers Results */}
                    {searchResults.managers?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <UserGroupIcon className="h-4 w-4 text-purple-600" />
                            Managers ({searchResults.managers.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("managers")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.managers.map((manager) => {
                            const Icon = getSearchIcon("manager")
                            return (
                              <button
                                key={manager.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(manager, "manager")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("manager")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{manager.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {manager.user_code} • {manager.email}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Brokerages Results */}
                    {searchResults.brokerages?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <BuildingStorefrontIcon className="h-4 w-4 text-yellow-600" />
                            Brokerages ({searchResults.brokerages.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("brokerages")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.brokerages.map((brokerage) => {
                            const Icon = getSearchIcon("brokerage")
                            return (
                              <button
                                key={brokerage.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(brokerage, "brokerage")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("brokerage")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{brokerage.property_name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {brokerage.property_code} • {brokerage.agent_name} • ₹{Number.parseFloat(brokerage.total_brokerage || 0).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Estimates Results */}
                    {searchResults.estimates?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CalculatorIcon className="h-4 w-4 text-indigo-600" />
                            Estimates ({searchResults.estimates.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("estimates")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.estimates.map((estimate) => {
                            const Icon = getSearchIcon("estimate")
                            return (
                              <button
                                key={estimate.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(estimate, "estimate")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("estimate")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{estimate.property_code}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {estimate.agent_code} • ₹{Number.parseFloat(estimate.estimated_amount || 0).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Visits Results */}
                    {searchResults.visits?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <EyeIcon className="h-4 w-4 text-pink-600" />
                            Visits ({searchResults.visits.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("visits")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.visits.map((visit) => {
                            const Icon = getSearchIcon("visit")
                            return (
                              <button
                                key={visit.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(visit, "visit")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("visit")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{visit.client_name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {visit.property_code} • {visit.agent_code} • {visit.visit_status}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Admins Results */}
                    {searchResults.admins?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <ShieldCheckIcon className="h-4 w-4 text-red-600" />
                            Admins ({searchResults.admins.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleViewAllClick("admins")}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchResults.admins.map((admin) => {
                            const Icon = getSearchIcon("admin")
                            return (
                              <button
                                key={admin.id}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
                                onClick={() => handleSuggestionClick(admin, "admin")}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${getSearchColor("admin")}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{admin.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {admin.user_code} • {admin.email} • {admin.role}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching across all available categories</p>
                  </div>
                ) : null}
              </div>
            )}
          </form>
        </div>

        {/* Right Section - Notifications and Profile */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
           <Menu as="div" className="relative">
             <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-0.5 border border-primary-200/60 shadow-sm hover:shadow-md transition-all duration-200 h-12">
               <Menu.Button className="relative px-3 py-2.5 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-gradient-to-br hover:from-primary-100 hover:to-primary-200 transition-all duration-200 h-full flex items-center justify-center">
                 <BellIcon className="h-5 w-5" />
                 {unreadCount > 0 && (
                   <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm">
                     {unreadCount}
                   </span>
                 )}
               </Menu.Button>
             </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-300"
              enterFrom="transform opacity-0 scale-95 translate-y-[-10px]"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-200"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 translate-y-[-10px]"
            >
              <Menu.Items className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden backdrop-blur-sm">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-4 relative overflow-hidden">
                  {/* Background pattern for visual interest */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 flex items-center justify-center border border-white/30">
                        <BellIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                          <p className="text-white/80 text-xs">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-96 overflow-y-auto scrollbar-responsive">
                  {notificationsLoading ? (
                    <div className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600"></div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Loading notifications...</p>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-100 rounded-2xl">
                          <BellIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 mb-1">No new notifications</p>
                          <p className="text-sm text-gray-500">You're all caught up! Check back later for updates.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif, index) => (
                        <Menu.Item key={notif.id}>
                          {({ active }) => (
                            <button
                              onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                              className={`block w-full text-left transition-all duration-200 ${
                                active ? "bg-gradient-to-r from-primary-50 to-primary-100/50" : ""
                              } ${
                                !notif.is_read ? "bg-gradient-to-r from-blue-50/80 to-indigo-50/50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Notification Icon */}
                                  <div className={`flex-shrink-0 p-2.5 rounded-xl ${
                                    !notif.is_read 
                                      ? "bg-gradient-to-br from-primary-500 to-primary-600 shadow-md" 
                                      : "bg-gray-100"
                                  }`}>
                                    <BellIcon className={`h-4 w-4 ${
                                      !notif.is_read ? "text-white" : "text-gray-500"
                                    }`} />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className={`font-semibold text-sm leading-5 ${
                                        !notif.is_read ? "text-gray-900" : "text-gray-700"
                                      }`}>
                                        {notif.title}
                                      </h4>
                                      {!notif.is_read && (
                                        <div className="flex-shrink-0">
                                          <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm"></span>
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Message preview if available */}
                                    {notif.message && (
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-2">
                                      <span className={`text-xs font-medium ${
                                        !notif.is_read ? "text-primary-600" : "text-gray-500"
                                      }`}>
                                        {notif.formatted_created_at}
                                      </span>
                                      {!notif.is_read && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
                                          New
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <Menu.Item>
                      {({ close }) => (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            close();
                            router.push("/notifications");
                          }}
                          className="block w-full text-center px-6 py-4 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>View all notifications</span>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Enhanced User Profile Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 p-1 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200">
              <div className="rounded-full border-2 border-gray-200 shadow-md p-0.5 bg-white">
                <UserAvatar user={user} size="sm" showStatus={true} />
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-sm font-semibold text-gray-900 block">{user?.name}</span>
                <span className="text-xs text-primary-600 block capitalize font-medium">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
              {/* <ChevronDownIcon className="h-4 w-4 text-gray-400" /> */}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200">
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border-2 border-gray-200 shadow-md p-0.5 bg-white">
                      <UserAvatar user={user} size="md" showStatus={true} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-primary-600 capitalize font-medium">{user?.role?.replace("_", " ")}</p>
                      <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push("/profile")}
                      className={`${active ? "bg-primary-50 text-primary-700" : "text-gray-700"} block w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3`}
                    >
                      <UserIcon className="h-4 w-4" />
                      Your Profile
                    </button>
                  )}
                </Menu.Item>
                <CheckPermission permission="settings-list">
                  <Menu.Item>
                    {({ active }) => (
                    <button
                      onClick={() => router.push("/settings")}
                      className={`${active ? "bg-primary-50 text-primary-700" : "text-gray-700"} block w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3`}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Settings
                    </button>
                  )}
                </Menu.Item>
                </CheckPermission>
                <div className="border-t border-gray-100 my-1"></div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${active ? "bg-red-50 text-red-700" : "text-red-600"} block w-full text-left px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3`}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
