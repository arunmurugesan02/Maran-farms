import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  addAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
  updateProfileApi,
  getMeApi
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  pincode: ""
};

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [localAddresses, setLocalAddresses] = useState(user?.addresses || []);

  const defaultAddress = useMemo(
    () => localAddresses.find((item) => item.isDefault),
    [localAddresses]
  );

  const refreshMe = async () => {
    const me = await getMeApi();
    setLocalAddresses(me.addresses || []);
    setName(me.name || "");
    setPincode(me.pincode || "");
  };

  const profileMutation = useMutation({
    mutationFn: () => updateProfileApi({ name, pincode }),
    onSuccess: () => {
      toast({ title: "Profile updated" });
    },
    onError: (error) => {
      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  const addAddressMutation = useMutation({
    mutationFn: () => addAddressApi(addressForm),
    onSuccess: async () => {
      setAddressForm(EMPTY_ADDRESS);
      await refreshMe();
      toast({ title: "Address saved" });
    },
    onError: (error) => {
      toast({
        title: "Failed to save address",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => deleteAddressApi(id),
    onSuccess: async () => {
      await refreshMe();
      toast({ title: "Address deleted" });
    }
  });

  const defaultAddressMutation = useMutation({
    mutationFn: (id: string) => setDefaultAddressApi(id),
    onSuccess: async () => {
      await refreshMe();
      toast({ title: "Default address updated" });
    }
  });

  if (!user) {
    return (
      <div className="container py-12">
        <p className="text-muted-foreground">Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-display text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your details and delivery addresses.</p>
      </div>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Profile Details</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="border border-border rounded-xl px-3 py-2 bg-background"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border border-border rounded-xl px-3 py-2 bg-background"
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
        </div>
        <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
          {profileMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Saved Addresses</h2>
        {localAddresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3">
            {localAddresses.map((item) => (
              <div key={item._id} className="border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {item.label} {item.isDefault ? "(Default)" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.fullName} · {item.phone}</p>
                  <p className="text-sm text-muted-foreground">{item.address} - {item.pincode}</p>
                </div>
                <div className="flex gap-2">
                  {!item.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => defaultAddressMutation.mutate(item._id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAddressMutation.mutate(item._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Add New Address</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border border-border rounded-xl px-3 py-2 bg-background"
              placeholder="Label"
              value={addressForm.label}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
            />
            <input
              className="border border-border rounded-xl px-3 py-2 bg-background"
              placeholder="Full name"
              value={addressForm.fullName}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <input
              className="border border-border rounded-xl px-3 py-2 bg-background"
              placeholder="Phone"
              value={addressForm.phone}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              className="border border-border rounded-xl px-3 py-2 bg-background"
              placeholder="Pincode"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
            />
          </div>
          <textarea
            className="border border-border rounded-xl px-3 py-2 bg-background w-full"
            placeholder="Address"
            value={addressForm.address}
            onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <Button onClick={() => addAddressMutation.mutate()} disabled={addAddressMutation.isPending}>
            {addAddressMutation.isPending ? "Saving..." : "Add Address"}
          </Button>
        </div>
      </section>

      {defaultAddress && (
        <p className="text-sm text-muted-foreground">Default delivery address: {defaultAddress.address}</p>
      )}
    </div>
  );
};

export default Profile;
