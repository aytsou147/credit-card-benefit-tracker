'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CreditCard } from 'lucide-react';
import { CARD_TEMPLATES, CardTemplate } from '@/lib/card-templates';
import { periodTypeLabel } from '@/lib/periods';

interface AddCardDialogProps {
  onAddTemplate: (template: CardTemplate) => void;
  onAddCustom: (name: string, issuer: string, annualFee: number, color: string) => void;
}

export function AddCardDialog({ onAddTemplate, onAddCustom }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [annualFee, setAnnualFee] = useState('');
  const [color, setColor] = useState('#6366f1');

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAddCustom(name, issuer, parseFloat(annualFee) || 0, color);
    setName('');
    setIssuer('');
    setAnnualFee('');
    setColor('#6366f1');
    setOpen(false);
  }

  function handleTemplateSelect(template: CardTemplate) {
    onAddTemplate(template);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> Add Card
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Credit Card</DialogTitle>
          <DialogDescription>
            Choose from a template or create a custom card.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="templates">
          <TabsList className="w-full">
            <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="space-y-3 mt-4">
            {CARD_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: template.color }}
                    >
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.issuer} · ${template.annual_fee}/yr · {template.benefits.length} benefit{template.benefits.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {template.benefits.map((b) => (
                      <Badge key={b.name} variant="secondary" className="text-xs">
                        {b.name}
                        {b.credit_type === 'dollar' && ` $${b.credit_amount}`}
                        <span className="ml-1 opacity-60">
                          {periodTypeLabel(b.period_type).toLowerCase()}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="custom" className="mt-4">
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Card Name</Label>
                <Input
                  id="card-name"
                  placeholder="e.g. My Rewards Card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-issuer">Issuer</Label>
                <Input
                  id="card-issuer"
                  placeholder="e.g. Chase, Amex"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annual-fee">Annual Fee</Label>
                  <Input
                    id="annual-fee"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={annualFee}
                    onChange={(e) => setAnnualFee(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="card-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-14 p-1 cursor-pointer"
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Card
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
