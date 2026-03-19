import { Component, ChangeDetectionStrategy, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
export class ProductFormComponent {
  private fb = inject(NonNullableFormBuilder);

  categories = input.required<Category[]>();
  initialData = input<ProductUpdate | null>(null);
  isLoading = input<boolean>(false);
  isUploading = input<boolean>(false);
  
  save = output<ProductCreate | ProductUpdate>();
  cancel = output<void>();
  uploadFile = output<File>();

  imagePreview = signal<string | null>(null);

  productForm = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required, Validators.minLength(5)] }),
    description: this.fb.control('', { validators: [Validators.required] }),
    price: this.fb.control(0, { validators: [Validators.required, Validators.min(0)] }),
    category_slug: this.fb.control('', { validators: [Validators.required] }),
    image_url: this.fb.control(''),
    is_sold: this.fb.control(false)
  });

  constructor() {
    effect(() => {
      const data = this.initialData();

      untracked(() => {
        if (data) {
          this.productForm.patchValue(data);
          this.imagePreview.set(data.image_url || null);
          return;
        }

        this.productForm.reset({
          title: '',
          description: '',
          price: 0,
          category_slug: '',
          image_url: '',
          is_sold: false
        });
        this.imagePreview.set(null);
      });
    });
  }

  updateImageUrl(url: string) {
    this.productForm.controls.image_url.setValue(url);
    this.imagePreview.set(url);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(file);
      this.uploadFile.emit(file);
    }
  }

  removeImage() {
    this.imagePreview.set(null);
    this.productForm.controls.image_url.setValue('');
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.save.emit(this.productForm.getRawValue());
    }
  }
}
