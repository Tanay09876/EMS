import mongoose from "mongoose";

const productivityTaskSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    date: { type: Date, required: true },
    estimatedHours: { type: Number, default: 1, min: 0 },
    actualHours: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED"],
      default: "TODO",
    },
  },
  { timestamps: true },
);

productivityTaskSchema.index({ employeeId: 1, date: -1 });

const ProductivityTask =
  mongoose.models.ProductivityTask ||
  mongoose.model("ProductivityTask", productivityTaskSchema);

export default ProductivityTask;
