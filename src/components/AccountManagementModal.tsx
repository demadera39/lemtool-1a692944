import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Trash2, Loader2 } from "lucide-react";

interface AccountManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function AccountManagementModal({
  open,
  onOpenChange,
  userEmail,
}: AccountManagementModalProps) {
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error changing password",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.functions.invoke("delete-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings for {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Change Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              Change Password
            </div>
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                size="sm"
              >
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-4">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground mb-3">
                Once you delete your account, there is no going back. All your projects and data will be permanently removed.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
