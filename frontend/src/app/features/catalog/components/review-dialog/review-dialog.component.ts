import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

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
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Calificar a {{ data.sellerName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="reviewForm" class="review-form">
        <div class="star-rating" role="radiogroup" aria-label="Calificación">
          @for (star of stars; track star) {
            <button
              type="button"
              class="star-button"
              role="radio"
              [attr.aria-checked]="star === ratingValue()"
              [attr.aria-label]="getStarAriaLabel(star)"
              [class.selected]="isStarSelected(star)"
              (click)="setRating(star)">
              <mat-icon aria-hidden="true">{{ isStarSelected(star) ? 'grade' : 'star_outline' }}</mat-icon>
            </button>
          }
        </div>

        <mat-error *ngIf="reviewForm.controls.rating.touched && reviewForm.controls.rating.errors?.['min']">
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
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="reviewForm.invalid">
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
      gap: 0.25rem;
    }

    .star-button {
      border: 0;
      background: transparent;
      border-radius: 999px;
      padding: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 160ms ease, transform 160ms ease;
    }

    .star-button:hover {
      background: rgba(245, 158, 11, 0.12);
      transform: translateY(-1px);
    }

    .star-button:focus-visible {
      outline: 2px solid rgba(245, 158, 11, 0.35);
      outline-offset: 2px;
    }

    .star-button mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #cbd5e1;
      transition: color 160ms ease;
    }

    .star-button.selected mat-icon {
      color: #f59e0b;
    }

    .full-width {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ReviewDialogComponent>);
  readonly data = inject<ReviewDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly stars = [1, 2, 3, 4, 5] as const;
  readonly ratingValue = signal(0);

  readonly reviewForm = this.fb.nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    comment: ['']
  });

  setRating(rating: number): void {
    this.ratingValue.set(rating);
    this.reviewForm.controls.rating.setValue(rating);
    this.reviewForm.controls.rating.markAsDirty();
    this.reviewForm.controls.rating.markAsTouched();
  }

  isStarSelected(star: number): boolean {
    return star <= this.ratingValue();
  }

  getStarAriaLabel(star: number): string {
    return `Calificar con ${star} estrella${star === 1 ? '' : 's'}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.reviewForm.valid) {
      this.dialogRef.close(this.reviewForm.getRawValue());
    }
  }
}
