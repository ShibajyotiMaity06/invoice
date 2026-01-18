const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    // Additional fields for future use
    taxId: {
      type: String,
      trim: true,
    },
    defaultCurrency: {
      type: String,
      uppercase: true,
      default: 'USD',
    },
    defaultPaymentTerms: {
      type: Number,
      default: 30,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    // For smart invoice defaults
    lastInvoiceData: {
      items: [{
        description: String,
        quantity: Number,
        rate: Number,
      }],
      lastInvoiceDate: Date,
    },
    // Statistics
    totalInvoiced: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    invoiceCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for workspace + name uniqueness
clientSchema.index({ workspace: 1, name: 1 });

// Text index for search
clientSchema.index({ name: 'text', email: 'text' });

// Virtual for full address
clientSchema.virtual('fullAddress').get(function () {
  const parts = [];
  if (this.address?.street) parts.push(this.address.street);
  if (this.address?.city) parts.push(this.address.city);
  if (this.address?.state) parts.push(this.address.state);
  if (this.address?.zipCode) parts.push(this.address.zipCode);
  if (this.address?.country) parts.push(this.address.country);
  return parts.join(', ');
});

// Virtual for outstanding balance
clientSchema.virtual('outstandingBalance').get(function () {
  return this.totalInvoiced - this.totalPaid;
});

// Ensure virtuals are included in JSON
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);