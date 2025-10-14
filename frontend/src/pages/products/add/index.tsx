import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  addProduct,
  getConditions,
  getPriceUnits,
  uploadImages, 
} from "../../../services/products/product.api";
import { getCategories } from "../../../services/products/category.api";
import { useSelector } from "react-redux";
import { Container } from "../../../components/layout/Container";
import Image from "next/image";

const AddProductPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [conditionId, setConditionId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [priceUnitId, setPriceUnitId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [minRentalDuration, setMinRentalDuration] = useState("");
  const [maxRentalDuration, setMaxRentalDuration] = useState("");
  const [quantity, setQuantity] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Data for selects
  const [categories, setCategories] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [priceUnits, setPriceUnits] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, conditionsRes, priceUnitsRes] = await Promise.all([
        getCategories(),
        getConditions(),
        getPriceUnits(),
      ]);

      const categoriesJson = await categoriesRes.json();
      const conditionsJson = await conditionsRes.json();
      const priceUnitsJson = await priceUnitsRes.json();

      setCategories(
        Array.isArray(categoriesJson.data)
          ? categoriesJson.data
          : Array.isArray(categoriesJson)
          ? categoriesJson
          : []
      );
      setConditions(
        Array.isArray(conditionsJson.data)
          ? conditionsJson.data
          : Array.isArray(conditionsJson)
          ? conditionsJson
          : []
      );
      setPriceUnits(
        Array.isArray(priceUnitsJson.data)
          ? priceUnitsJson.data
          : Array.isArray(priceUnitsJson)
          ? priceUnitsJson
          : []
      );
    } catch (err: any) {
      setError("Failed to load initial data");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(e.target.files);
      const previews: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        previews.push(URL.createObjectURL(e.target.files[i]));
      }
      setPreviewImages(previews);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const newTags = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setTags(newTags);
  };

  const validateForm = () => {
    if (!title.trim()) return "Title is required";
    if (!basePrice || parseFloat(basePrice) <= 0)
      return "Base Price must be positive number";
    if (!depositAmount || parseFloat(depositAmount) <= 0)
      return "Deposit Amount must be positive number";
    if (!quantity || parseInt(quantity) < 1)
      return "Quantity must be at least 1";
    if (!categoryId) return "Category is required";
    if (!conditionId) return "Condition is required";
    if (!priceUnitId) return "Price Unit is required";
    if (!images || images.length === 0) return "At least one image is required";
    if (images.length > 10) return "Maximum 10 images allowed";
    const minDur = parseInt(minRentalDuration) || 0;
    const maxDur = parseInt(maxRentalDuration) || 0;
    if (minDur > 0 && maxDur > 0 && minDur > maxDur)
      return "Min Rental Duration cannot exceed Max Rental Duration";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Upload images first
      const imageFormData = new FormData();
      if (images) {
        for (let i = 0; i < images.length; i++) {
          imageFormData.append("images", images[i]);
        }
      }
      const uploadRes = await uploadImages(imageFormData);
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Image upload failed");
      }
      const imageUrls = uploadResult.data || []; 

      // Step 2: Prepare JSON body with image URLs
      const productData = {
        Title: title.trim(),
        ShortDescription: shortDescription.trim(),
        Description: description.trim(),
        CategoryId: categoryId,
        ConditionId: conditionId,
        BasePrice: basePrice,
        PriceUnitId: priceUnitId,
        DepositAmount: depositAmount,
        MinRentalDuration: minRentalDuration || undefined,
        MaxRentalDuration: maxRentalDuration || undefined,
        Currency: "VND", 
        Quantity: quantity,
        Address: address.trim() || undefined,
        City: city.trim() || undefined,
        District: district.trim() || undefined,
        Tags: tags.length > 0 ? tags : undefined,
        ImageUrls: imageUrls, 
      };

      // Step 3: Send JSON to addProduct
      const addRes = await addProduct(productData); 
      const result = await addRes.json();
      if (result.success) {
        setSuccess(true);
        router.push("/product/manage");
      } else {
        setError(result.message || "Add product failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

//   // Auth check
//   const isAuthenticated = useSelector((state: any) => !!state.auth.accessToken);
//   if (!isAuthenticated) {
//     router.push("/auth/login");
//     return null;
//   }

  return (
    <Container>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
        {error && (
          <div className="bg-red-500 text-white p-4 mb-4 rounded">{error}</div>
        )}
        {success && (
          <div className="bg-green-500 text-white p-4 mb-4 rounded">
            Product added successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Short Description
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option
                  key={cat.CategoryId || cat._id}
                  value={cat.CategoryId || cat._id}
                >
                  {cat.Name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Condition *
            </label>
            <select
              value={conditionId}
              onChange={(e) => setConditionId(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select Condition</option>
              {conditions.map((cond) => (
                <option
                  key={cond.ConditionId || cond._id}
                  value={cond.ConditionId || cond._id}
                >
                  {cond.ConditionName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Price Unit *
            </label>
            <select
              value={priceUnitId}
              onChange={(e) => setPriceUnitId(e.target.value)}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select Unit</option>
              {priceUnits.map((unit) => (
                <option
                  key={unit.UnitId || unit._id}
                  value={unit.UnitId || unit._id}
                >
                  {unit.UnitName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Base Price (VND) *
            </label>
            <input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Deposit Amount (VND) *
            </label>
            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Rental Duration (days)
              </label>
              <input
                type="number"
                min="1"
                value={minRentalDuration}
                onChange={(e) => setMinRentalDuration(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Rental Duration (days)
              </label>
              <input
                type="number"
                min="1"
                value={maxRentalDuration}
                onChange={(e) => setMaxRentalDuration(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags.join(", ")}
              onChange={handleTagsChange}
              placeholder="e.g., vintage, electronics"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Images (up to 10) *
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />
            {previewImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previewImages.map((src, idx) => (
                  <Image
                    key={idx}
                    src={src}
                    alt={`Preview ${idx}`}
                    width={100}
                    height={100}
                    className="object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </Container>
  );
};

export default AddProductPage;
