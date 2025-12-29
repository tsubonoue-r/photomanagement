'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { OrganizationCard } from './OrganizationCard';
import { OrganizationForm } from './OrganizationForm';
import { DeleteOrganizationDialog } from './DeleteOrganizationDialog';
import type {
  OrganizationWithCounts,
  OrganizationApiResponse,
  OrganizationListResponse,
} from '@/types/organization';

interface OrganizationListProps {
  initialOrganizations?: OrganizationWithCounts[];
}

/**
 * Organization List Component
 *
 * Displays a grid of organization cards with:
 * - Search functionality
 * - Create new organization button
 * - Edit and delete actions
 */
export function OrganizationList({
  initialOrganizations = [],
}: OrganizationListProps) {
  const [organizations, setOrganizations] =
    useState<OrganizationWithCounts[]>(initialOrganizations);
  const [loading, setLoading] = useState(!initialOrganizations.length);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationWithCounts | null>(null);
  const [deletingOrganization, setDeletingOrganization] =
    useState<OrganizationWithCounts | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/organizations');
      const result: OrganizationApiResponse<OrganizationListResponse> =
        await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch organizations');
      }

      setOrganizations(result.data?.organizations || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch organizations'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Filter organizations by search
  const filteredOrganizations = organizations.filter((org) => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return (
      org.name.toLowerCase().includes(search) ||
      org.slug.toLowerCase().includes(search)
    );
  });

  // Handle organization created/updated
  const handleOrganizationSaved = () => {
    setShowCreateForm(false);
    setEditingOrganization(null);
    fetchOrganizations();
  };

  // Handle organization deleted
  const handleOrganizationDeleted = () => {
    setDeletingOrganization(null);
    fetchOrganizations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search organizations..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={fetchOrganizations}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrganizations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {debouncedSearch
              ? 'No organizations found'
              : 'No organizations yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearch
              ? 'Try adjusting your search criteria'
              : 'Get started by creating your first organization'}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Organization
            </button>
          )}
        </div>
      )}

      {/* Organization Grid */}
      {!loading && !error && filteredOrganizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
              onEdit={setEditingOrganization}
              onDelete={setDeletingOrganization}
              userRole="OWNER" // This should come from membership data
            />
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateForm && (
        <OrganizationForm
          onSave={handleOrganizationSaved}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Organization Modal */}
      {editingOrganization && (
        <OrganizationForm
          organization={editingOrganization}
          onSave={handleOrganizationSaved}
          onCancel={() => setEditingOrganization(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingOrganization && (
        <DeleteOrganizationDialog
          organization={deletingOrganization}
          onConfirm={handleOrganizationDeleted}
          onCancel={() => setDeletingOrganization(null)}
        />
      )}
    </div>
  );
}

export default OrganizationList;
