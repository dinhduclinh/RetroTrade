
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/common/button";
import { Card } from "@/components/ui/common/card";
import { Input } from "@/components/ui/common/input";
import { Label } from "@/components/ui/common/label";
import { Textarea } from "@/components/ui/common/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/common/select";
import { Loader2, Gavel, AlertCircle } from "lucide-react";
import { resolveDispute } from "@/services/moderator/disputeOrder.api";
import axios from "axios";

const DECISIONS = [
  {
    value: "refund_full",
    label: "Hoàn tiền toàn bộ",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    value: "refund_partial",
    label: "Hoàn tiền một phần",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    value: "reject",
    label: "Từ chối tranh chấp",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  {
    value: "keep_for_seller",
    label: "Giữ tiền cho người bán",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

interface DisputeResolutionFormProps {
  disputeId: string;
  totalAmount: number;
  onSuccess?: () => void;
}

export default function DisputeResolutionForm({
  disputeId,
  totalAmount,
  onSuccess,
}: DisputeResolutionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

const handleSubmit = async () => {
  if (!decision) return toast.error("Vui lòng chọn quyết định xử lý");
  if (["refund_full", "refund_partial"].includes(decision) && !refundAmount) {
    return toast.error("Vui lòng nhập số tiền hoàn");
  }

  setLoading(true);
  try {
    await resolveDispute(disputeId, {
      decision,
      notes: notes.trim() || undefined,
      refundAmount:
        decision === "refund_full" ? totalAmount : Number(refundAmount),
    });

    toast.success("Xử lý tranh chấp thành công!");
    onSuccess?.();
    router.push("/moderator/dispute");
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || error.message || "Xử lý thất bại"
    );
  } finally {
    setLoading(false);
  }
};

  const selectedDecision = DECISIONS.find((d) => d.value === decision);

  return (
    <Card className="border-2 border-orange-200 shadow-2xl bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center shadow-lg">
            <Gavel className="w-9 h-9 text-orange-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-orange-800">
              Xử lý tranh chấp
            </h2>
            <p className="text-orange-600">Hãy đưa ra quyết định công bằng</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-lg font-semibold">Quyết định xử lý</Label>
            <Select
              value={decision}
              onValueChange={setDecision}
              disabled={loading}
            >
              <SelectTrigger className="mt-2 h-14 text-lg">
                <SelectValue placeholder="Chọn quyết định..." />
              </SelectTrigger>
              <SelectContent>
                {DECISIONS.map((d) => (
                  <SelectItem
                    key={d.value}
                    value={d.value}
                    className="text-lg py-3"
                  >
                    <span className={d.color}>●</span> {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {["refund_full", "refund_partial"].includes(decision) && (
            <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-orange-300">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Số tiền hoàn trả
              </Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={
                  decision === "refund_full"
                    ? totalAmount.toString()
                    : "Nhập số tiền..."
                }
                className="mt-2 text-2xl font-bold"
                disabled={decision === "refund_full" || loading}
                min="0"
                max={totalAmount}
              />
              <p className="text-sm text-gray-600 mt-2">
                Tối đa:{" "}
                <span className="font-bold text-orange-600">
                  {totalAmount.toLocaleString()}₫
                </span>
                {decision === "refund_full" && " → Tự động hoàn toàn bộ"}
              </p>
            </div>
          )}

          <div>
            <Label className="text-lg font-semibold">
              Ghi chú nội bộ (tùy chọn)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi rõ lý do xử lý, bằng chứng bổ sung..."
              className="mt-2 min-h-32"
              disabled={loading}
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.push("/moderator/dispute")}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg shadow-lg"
              onClick={handleSubmit}
              disabled={loading || !decision}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Gavel className="mr-2 h-5 w-5" />
                  Xử lý tranh chấp
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
