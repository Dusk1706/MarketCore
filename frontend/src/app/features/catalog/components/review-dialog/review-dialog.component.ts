import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface ReviewDialogData {
  sellerName: string;
}

export interface ReviewDialogResult {
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Calificar a {{ data.sellerName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="reviewForm" class="review-form">
        <div class="star-rating">
          @for (star of [1, 2, 3, 4, 5]; track star) {
            <button mat-icon-button type="button" (click)="setRating(star)">
              <mat-icon [class.filled]="star <= rating()">{{ star <= rating() ? 'star' : 'star_border' }}</mat-icon>
            </button>
          }
        </div>
        <mat-error *ngIf="reviewForm.get('rating')?.touched && reviewForm.get('rating')?.errors?.['min']">
          Por favor selecciona una calificación.
        </mat-error>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Comentario (opcional)</mat-label>
          <textarea matInput formControlName="comment" rows="4" placeholder="¿Cómo fue tu experiencia?"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="!reviewForm.valid">
        Enviar Reseña
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .review-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }
    .star-rating {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      mat-icon {
        font-size: 36px;
        height: 36px;
        width: 36px;
        color: #ccc;
        &.filled {
          color: #ffc107;
        }
      }
      button {
        width: 48px;
        height: 48px;
      }
    }
    .full-width {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewDialogComponent {
  dialogRef = inject(MatDialogRef<ReviewDialogComponent>);
  data = inject<ReviewDialogData>(MAT_DIALOG_DATA);
  fb = inject(FormBuilder);

  reviewForm = this.fb.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['']
  });

  get rating() {
    return () => this.reviewForm.get('rating')?.value || 0;
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
    this.reviewForm.get('rating')?.markAsTouched();
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.reviewForm.valid) {
      this.dialogRef.close(this.reviewForm.value as ReviewDialogResult);
    }
  }
}
