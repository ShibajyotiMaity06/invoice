const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1,
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: [0, 'Rate cannot be negative'],
  },
  amount: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    lineItems: [lineItemSchema],
    // Calculated fields
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    // Additional info
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    // Tracking
    sentAt: Date,
    viewedAt: [Date],
    paidAt: Date,
    // Payment info
    stripePaymentIntentId: String,
    stripeCheckoutSessionId: String,
    // For hosted invoice page
    accessToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceSchema.index({ workspace: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ workspace: 1, status: 1 });
invoiceSchema.index({ workspace: 1, dueDate: 1 });

// Calculate totals and generate access token before saving
invoiceSchema.pre('save', async function () {
  // Calculate line item amounts and tax
  this.subtotal = 0;
  this.taxTotal = 0;

  this.lineItems.forEach((item) => {
    item.amount = item.quantity * item.rate;
    item.taxAmount = (item.amount * item.taxRate) / 100;
    this.subtotal += item.amount;
    this.taxTotal += item.taxAmount;
  });

  // Calculate discount
  if (this.discountType === 'percentage') {
    this.discountAmount = (this.subtotal * this.discountValue) / 100;
  } else {
    this.discountAmount = this.discountValue;
  }

  // Calculate total
  this.total = this.subtotal + this.taxTotal - this.discountAmount;
  this.amountDue = this.total - this.amountPaid;

  // Generate access token for hosted page
  if (!this.accessToken) {
    const crypto = require('crypto');
    this.accessToken = crypto.randomBytes(32).toString('hex');
  }
});

// Virtual for checking if overdue
invoiceSchema.virtual('isOverdue').get(function () {
  return (
    this.status !== 'paid' &&
    this.status !== 'cancelled' &&
    new Date() > this.dueDate
  );
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);