import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  addProduct,
  getConditions,
  getPriceUnits,
  uploadImages,
} from "../../../../services/products/product.api";
import { getCategories } from "../../../../services/products/category.api";
import { useSelector } from "react-redux";
import { Container } from "../../../../components/layout/Container";
import Image from "next/image";
import { toast } from "sonner";

const AddProductPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [secondaryPreviews, setSecondaryPreviews] = useState<string[]>([]);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryFiles, setSecondaryFiles] = useState<File[]>([]);

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
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [categories, setCategories] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [priceUnits, setPriceUnits] = useState<any[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [selectedCategoryNameState, setSelectedCategoryNameState] =
    useState("Chọn danh mục");

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = useSelector((state: any) => !!state.auth.accessToken);
  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedPath([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      toast.error("Không thể tải dữ liệu ban đầu");
    }
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ chấp nhận file hình ảnh");
        return;
      }
      setPrimaryFile(file);
      setPrimaryPreview(URL.createObjectURL(file));
    }
  };

  const removePrimaryImage = () => {
    setPrimaryFile(null);
    setPrimaryPreview(null);
    if (primaryInputRef.current) primaryInputRef.current.value = "";
  };

  const handleSecondaryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (secondaryFiles.length + newFiles.length > 5) {
        toast.error("Tối đa 5 hình ảnh phụ được phép");
        return;
      }
      setSecondaryFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setSecondaryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeSecondaryImage = (index: number) => {
    setSecondaryFiles((prev) => prev.filter((_, i) => i !== index));
    setSecondaryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  };

  const handleTagsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const currentValue = tagsInput.trim();
      if (currentValue && !tags.includes(currentValue)) {
        setTags((prev) => [...prev, currentValue]);
      }
      setTagsInput(""); 
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCategoryClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      setSelectedPath([]);
    }
  };

  const handleBackClick = () => {
    setSelectedPath((prev) => prev.slice(0, -1));
  };

  const hasChildren = (catId: string): boolean => {
    return categories.some(
      (c) =>
        c.parentCategoryId && c.parentCategoryId.toString() === catId.toString()
    );
  };

  const handleCategorySelect = (cat: any) => {
    const catId = cat._id.toString();
    const categoryName = cat.name || cat.Name || `Unnamed Category`;
    if (!hasChildren(catId)) {
      setCategoryId(catId);
      setSelectedCategoryNameState(categoryName);
      setShowDropdown(false);
      setSelectedPath([]);
    } else {
      setSelectedPath((prev) => [...prev, catId]);
    }
  };

  const renderCurrentCategories = () => {
    let currentCats: any[] = categories.filter((c) => !c.parentCategoryId);
    for (const id of selectedPath) {
      currentCats = categories.filter(
        (c) => c.parentCategoryId && c.parentCategoryId.toString() === id
      );
      if (currentCats.length === 0) break;
    }
    return currentCats.map((cat, index) => {
      const catId = cat._id.toString();
      const categoryName = cat.name || cat.Name || `Unnamed Category ${index}`;
      return (
        <div
          key={catId || index}
          className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
          onClick={() => handleCategorySelect(cat)}
        >
          <span>{categoryName}</span>
          {hasChildren(catId) && (
            <span className="text-gray-400 text-xs">→</span>
          )}
        </div>
      );
    });
  };

  const validateForm = () => {
    if (!title.trim()) return "Tên sản phẩm là bắt buộc";
    if (!basePrice || parseFloat(basePrice) <= 0)
      return "Giá thuê phải là số dương";
    if (!depositAmount || parseFloat(depositAmount) <= 0)
      return "Tiền đặt cọc phải là số dương";
    if (!quantity || parseInt(quantity) < 1) return "Số lượng phải ít nhất 1";
    if (!categoryId) return "Danh mục là bắt buộc";
    if (!conditionId) return "Tình trạng là bắt buộc";
    if (!priceUnitId) return "Đơn vị giá là bắt buộc";
    if (!primaryFile) return "Hình ảnh chính là bắt buộc";
    if (secondaryFiles.length > 5) return "Tối đa 5 hình ảnh phụ được phép";
    const minDur = parseInt(minRentalDuration) || 0;
    const maxDur = parseInt(maxRentalDuration) || 0;
    if (minDur > 0 && maxDur > 0 && minDur > maxDur)
      return "Thời gian thuê tối thiểu không được vượt quá thời gian thuê tối đa";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload images first (primary first, then secondary)
      const imageFormData = new FormData();
      if (primaryFile) {
        imageFormData.append("images", primaryFile);
      }
      secondaryFiles.forEach((file) => {
        imageFormData.append("images", file);
      });
      const uploadRes = await uploadImages(imageFormData);
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Tải hình ảnh thất bại");
      }
      const imageUrls = uploadResult.data.map((img: any) => img.Url) || [];

      // Step 2: Prepare JSON body with image URLs - Clean tags to array
      const cleanTags = tags.filter((t) => t && t.trim().length > 0);
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
        Tags: cleanTags.length > 0 ? cleanTags : [],
        ImageUrls: imageUrls,
      };

      // Step 3: Send JSON to addProduct
      const addRes = await addProduct(productData);
      const result = await addRes.json();
      if (result.success) {
        toast.success("Sản phẩm được thêm thành công!");
        router.push("/products/myproducts");
      } else {
        toast.error(result.message || "Thêm sản phẩm thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Thêm sản phẩm</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 space-y-6">
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">
                    Hình ảnh chính (bắt buộc)
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {primaryPreview ? (
                      <div className="relative">
                        <Image
                          src={primaryPreview}
                          alt="Hình ảnh chính"
                          width={200}
                          height={200}
                          className="object-cover rounded w-full h-48"
                        />
                        <button
                          type="button"
                          onClick={removePrimaryImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="primary-upload"
                        className="cursor-pointer block text-center"
                      >
                        <div className="text-3xl mb-2">📷</div>
                        <p className="text-gray-500">
                          Click để upload hình ảnh chính
                        </p>
                        <p className="text-sm text-gray-400">
                          PNG, JPG dưới 5MB
                        </p>
                      </label>
                    )}
                    <input
                      ref={primaryInputRef}
                      id="primary-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePrimaryImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Hình ảnh phụ (tối đa 5)
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <label
                      htmlFor="secondary-upload"
                      className="cursor-pointer block text-center mb-4"
                    >
                      <div className="text-3xl mb-2">📷</div>
                      <p className="text-gray-500">
                        Click để upload hình ảnh phụ
                      </p>
                      <p className="text-sm text-gray-400">PNG, JPG dưới 5MB</p>
                    </label>
                    <input
                      ref={secondaryInputRef}
                      id="secondary-upload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleSecondaryImageChange}
                      className="hidden"
                    />
                    {secondaryPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {secondaryPreviews.map((preview, idx) => (
                          <div key={idx} className="relative group">
                            <Image
                              src={preview}
                              alt={`Hình ảnh phụ ${idx + 1}`}
                              width={100}
                              height={100}
                              className="object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeSecondaryImage(idx)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {secondaryFiles.length < 5 && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => secondaryInputRef.current?.click()}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tên sản phẩm *
                  </label>
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
                    Mô tả ngắn
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
                    Mô tả
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Danh mục *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleCategoryClick}
                      className="w-full p-2 border rounded text-left bg-white flex justify-between items-center"
                    >
                      {selectedCategoryNameState}
                      <span className="text-gray-400">▼</span>
                    </button>
                    {showDropdown && (
                      <div
                        ref={categoryDropdownRef}
                        className="absolute top-full left-0 w-full bg-white border rounded shadow-lg z-50 max-h-60 overflow-hidden"
                      >
                        {selectedPath.length > 0 && (
                          <button
                            type="button"
                            onClick={handleBackClick}
                            className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                          >
                            ← Quay lại
                          </button>
                        )}
                        <div className="max-h-60 overflow-y-auto">
                          {renderCurrentCategories()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tình trạng *
                  </label>
                  <select
                    value={conditionId}
                    onChange={(e) => setConditionId(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Chọn tình trạng</option>
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
              </div>
            </div>

            {/* Giá cả và thời gian */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">
                Giá cả và thời gian
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá thuê (VND) theo đơn vị *
                  </label>
                  <div className="flex items-end space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      required
                      placeholder="Nhập giá thuê"
                      className="flex-1 p-2 border rounded"
                    />
                    <span className="text-gray-500">/</span>
                    <select
                      value={priceUnitId}
                      onChange={(e) => setPriceUnitId(e.target.value)}
                      required
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Chọn đơn vị</option>
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tiền đặt cọc (VND) *
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
                      Thời gian thuê tối thiểu (ngày)
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
                      Thời gian thuê tối đa (ngày)
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
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Số lượng và vị trí</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Số lượng *
                </label>
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
                  <label className="block text-sm font-medium mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tỉnh/Thành phố
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Xã/Phường
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Thẻ</h2>
            <div>
              <label className="block text-sm font-medium mb-1">
                Thẻ (nhập và nhấn Enter hoặc dấu phẩy để thêm)
              </label>
              <input
                ref={tagsInputRef}
                type="text"
                value={tagsInput}
                onChange={handleTagsChange}
                onKeyDown={handleTagsKeyDown}
                placeholder="ví dụ: cổ điển, điện tử"
                className="w-full p-2 border rounded mb-2"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white p-2 rounded disabled:opacity-50 hover:bg-blue-600"
            >
              {loading ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default AddProductPage;
