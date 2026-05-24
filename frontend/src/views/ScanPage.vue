<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab2" />
        </ion-buttons>
        <ion-title>Scan</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="scan-actions">
        <ion-button
          expand="block"
          data-testid="scan-scanner"
          :disabled="scanning"
          @click="onScan"
        >
          {{ scanning ? 'Scanning…' : 'Scan Barcode / QR' }}
        </ion-button>

        <ion-button
          expand="block"
          data-testid="scan-ocr"
          :disabled="recognizing"
          @click="onOcr"
        >
          {{ recognizing ? 'Recognizing…' : 'OCR (Camera Text)' }}
        </ion-button>
      </div>

      <div v-if="displayError" data-testid="scan-error" class="scan-error">
        {{ displayError }}
      </div>

      <div v-if="lastCode" data-testid="scan-result" class="scan-result">
        {{ lastCode }}
      </div>

      <div v-if="lastText && lastText !== lastCode" data-testid="ocr-result" class="scan-result">
        {{ lastText }}
      </div>

      <ion-button
        v-if="lastCode || lastText"
        expand="block"
        fill="outline"
        data-testid="scan-use"
        @click="onUse"
      >
        Use in Search
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton,
} from '@ionic/vue'
import { useScanner } from '../composables/useScanner'
import { useOcr } from '../composables/useOcr'
import { createFakeScannerAdapter } from '../scanner/fakeScannerAdapter'
import { createFakeOcrAdapter } from '../ocr/fakeOcrAdapter'

const router = useRouter()

// TODO(real-device): swap fake adapter for the real HID/SDK/BT scanner / OCR engine implementation here.
const { scanning, lastCode, error: scanError, scan } = useScanner(createFakeScannerAdapter())
const { recognizing, lastText, error: ocrError, recognize } = useOcr(createFakeOcrAdapter())

const displayError = computed(() => {
  const e = scanError.value ?? ocrError.value
  if (!e) return null
  return e instanceof Error ? e.message : String(e)
})

async function onScan() {
  await scan().catch(() => {/* error captured in scanError */})
}

async function onOcr() {
  await recognize().catch(() => {/* error captured in ocrError */})
}

function onUse() {
  router.push('/tabs/tab2')
}
</script>

<style scoped>
.scan-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.scan-result {
  font-size: 1.4rem;
  font-weight: bold;
  text-align: center;
  padding: 16px;
  margin-bottom: 8px;
  border: 1px solid var(--ion-color-medium);
  border-radius: 8px;
}
.scan-error {
  color: var(--ion-color-danger);
  text-align: center;
  padding: 8px;
  margin-bottom: 8px;
}
</style>
