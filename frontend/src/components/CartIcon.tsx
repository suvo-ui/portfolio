import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function CartIcon() {
  const {
    items,
    total,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    setCartOpen,
  } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10"
          aria-label="Open shopping cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-full w-full max-w-full flex-col px-4 pb-6 pt-10 sm:max-w-lg sm:px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
          <SheetDescription>
            Review and manage items in your shopping cart
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onRemove={() => removeItem(item.id)}
                      onUpdateQuantity={(quantity) =>
                        updateQuantity(item.id, quantity)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between gap-4 text-base font-semibold sm:text-lg">
                  <span>Total:</span>
                  <span className="text-right">
                    INR {total.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button className="w-full" size="lg" asChild>
                    <Link to="/checkout">Proceed to Checkout</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CartItemProps {
  item: import("@/context/CartContext").CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-border/60 bg-card/45 p-3 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4 sm:p-4">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="aspect-square h-full w-full rounded object-cover"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center rounded bg-muted/40">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0">
        <h4 className="truncate text-sm font-medium">{item.title}</h4>
        <p className="text-xs capitalize text-muted-foreground">{item.type}</p>
        <p className="mt-1 text-sm font-medium">
          INR {item.price.toLocaleString()}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="flex h-10 min-w-10 items-center justify-center text-sm">
            {item.quantity}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-10 w-10 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
