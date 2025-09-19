import React, { useState, useEffect } from 'react';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingClient) {
        // Update existing client
        const response = await fetch(`http://localhost:5000/api/clients/${editingClient._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setEditingClient(null);
          setFormData({ name: '', email: '', phone: '', address: '' });
          setShowForm(false);
          fetchClients();
        }
      } else {
        // Create new client
        const response = await fetch('http://localhost:5000/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setFormData({ name: '', email: '', phone: '', address: '' });
          setShowForm(false);
          fetchClients();
        }
      }
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-3xl font-bold text-gray-900">Client Management</h1> */}
          {/* <p className="text-gray-600 mt-1">Client Management</p> */}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancel' : '➕ Add New Client'}
        </button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingClient ? 'Update client information below' : 'Enter client information below'}
            </p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter complete address"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '⏳ Saving...' : editingClient ? '💾 Update Client' : '💾 Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Client List</h2>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'} registered
          </p>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : clients.length > 0 ? (
            <div className="overflow-hidden">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Client</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Address</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {clients.map((client) => (
                    <tr key={client._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-primary-600 text-sm font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {client.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {client._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{client.email}</div>
                        <div className="text-xs text-gray-500">{client.phone}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {client.address}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            className="btn btn-warning text-xs px-3 py-1"
                            onClick={() => handleEdit(client)}
                          >
                            ✏️ Edit
                          </button>
                          <span className="text-xs text-gray-400 px-3 py-1">
                            🔒 Protected
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first client above.</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add Your First Client
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;