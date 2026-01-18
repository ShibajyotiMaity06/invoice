const mongoose = require('mongoose');
const slugify = require('slugify');

const workspaceSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Workspace must have an owner'],
        },
        name: {
            type: String,
            required: [true, 'Workspace name is required'],
            trim: true,
            maxlength: [100, 'Workspace name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        businessProfile: {
            businessName: {
                type: String,
                trim: true,
            },
            address: {
                street: String,
                city: String,
                state: String,
                country: String,
                zipCode: String,
            },
            phone: {
                type: String,
                trim: true,
            },
            email: {
                type: String,
                lowercase: true,
                trim: true,
            },
            website: String,
            taxId: String,
            logo: {
                url: String,
                publicId: String,
            },
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                role: {
                    type: String,
                    enum: ['owner', 'admin', 'member'],
                    default: 'member',
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        settings: {
            currency: {
                type: String,
                default: 'USD',
            },
            timezone: {
                type: String,
                default: 'UTC',
            },
            dateFormat: {
                type: String,
                default: 'MM/DD/YYYY',
            },
        },
    },
    {
        timestamps: true,
    }
);

// Generate slug before saving
workspaceSchema.pre('save', async function () {
    if (!this.isModified('name')) {
        return;
    }

    // Generate base slug
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    this.slug = slug;
});

// Convert to public JSON
workspaceSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        owner: this.owner,
        name: this.name,
        slug: this.slug,
        description: this.description,
        businessProfile: this.businessProfile,
        members: this.members,
        settings: this.settings,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

module.exports = mongoose.model('Workspace', workspaceSchema);
