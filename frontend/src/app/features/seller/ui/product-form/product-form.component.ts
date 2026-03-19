import { Component, ChangeDetectionStrategy, output, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ProductCreate, ProductUpdate, Category } from '../../../../core/api/model/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatSelectModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent implements OnInit {
  categories = input.required<Category[]>();
  initialData = input<ProductUpdate | null>(null);
  isLoading = input<boolean>(false);
  
  save = output<ProductCreate | ProductUpdate>();
  cancel = output<void>();

  imagePreview: string | null = null;

  productForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    category_slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    image_url: new FormControl('', { nonNullable: true }),
    is_sold: new FormControl(false, { nonNullable: true })
  });

  ngOnInit() {
    const data = this.initialData();
    if (data) {
      this.productForm.patchValue(data);
      if (data.image_url) {
        this.imagePreview = data.image_url;
      }
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        this.imagePreview = base64String;
        this.productForm.controls.image_url.setValue(base64String);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.productForm.controls.image_url.setValue('');
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.save.emit(this.productForm.getRawValue());
    }
  }
}
