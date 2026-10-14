package com.coredash.app.data.motion

import android.content.Context
import android.os.SystemClock
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.Observer
import java.util.concurrent.Executors

/** Main-thread start/stop; one worker samples only the Y plane, at most once per second. */
class CameraMotionSensor(context: Context, private val lifecycleOwner: LifecycleOwner) {
    private val appContext = context.applicationContext
    private val mainExecutor = ContextCompat.getMainExecutor(appContext)
    private val analysisExecutor = Executors.newSingleThreadExecutor()
    private var provider: ProcessCameraProvider? = null
    private var analysis: ImageAnalysis? = null
    private var cameraState: LiveData<CameraState>? = null
    private var stateObserver: Observer<CameraState>? = null
    @Volatile private var generation = 0

    @Suppress("DEPRECATION") // CameraX negotiates the closest supported small resolution.
    fun start(threshold: Double, onFrame: (Boolean) -> Unit, onError: (String) -> Unit) {
        stop()
        val session = generation
        fun fail() {
            if (session == generation) {
                onError("Câmera indisponível. Verifique a permissão, o acesso à câmera e outros apps. Volte ao painel para tentar novamente.")
            }
        }
        try {
            val future = ProcessCameraProvider.getInstance(appContext)
            future.addListener({
                if (session != generation) return@addListener
                try {
                    val cameraProvider = future.get()
                    provider = cameraProvider
                    val selector = when {
                        cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA) -> CameraSelector.DEFAULT_FRONT_CAMERA
                        cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) -> CameraSelector.DEFAULT_BACK_CAMERA
                        else -> {
                            onError("Este aparelho não possui câmera disponível para despertar por movimento.")
                            return@addListener
                        }
                    }
                    val useCase = ImageAnalysis.Builder()
                        .setTargetResolution(Size(160, 120))
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                        .build()
                    analysis = useCase
                    val detector = LuminanceMotionDetector()
                    var lastAnalysis = 0L
                    val warmupUntil = SystemClock.elapsedRealtime() + 2_000L
                    useCase.setAnalyzer(analysisExecutor) { frame ->
                        try {
                            val now = SystemClock.elapsedRealtime()
                            if (session == generation && now - lastAnalysis >= 1_000L) {
                                lastAnalysis = now
                                val motion = detector.detect(sampleLuminance(frame), threshold)
                                mainExecutor.execute {
                                    if (session == generation) onFrame(now >= warmupUntil && motion)
                                }
                            }
                        } catch (_: Exception) {
                            mainExecutor.execute { fail() }
                        } finally {
                            // Also close skipped frames: never stall the camera pipeline.
                            frame.close()
                        }
                    }
                    val camera = cameraProvider.bindToLifecycle(lifecycleOwner, selector, useCase)
                    val observer = Observer<CameraState> { state ->
                        if (state.error != null) fail()
                    }
                    cameraState = camera.cameraInfo.cameraState
                    stateObserver = observer
                    cameraState?.observe(lifecycleOwner, observer)
                } catch (_: Exception) {
                    fail()
                }
            }, mainExecutor)
        } catch (_: Exception) {
            fail()
        }
    }

    fun stop() {
        generation++ // Invalidates pending provider initialization and queued frame callbacks.
        stateObserver?.let { cameraState?.removeObserver(it) }
        stateObserver = null
        cameraState = null
        analysis?.let {
            it.clearAnalyzer()
            provider?.unbind(it)
        }
        analysis = null
    }

    fun close() {
        stop()
        analysisExecutor.shutdown()
    }

    private fun sampleLuminance(frame: ImageProxy): ByteArray {
        val plane = frame.planes[0]
        val buffer = plane.buffer.duplicate()
        val base = buffer.position()
        val crop = frame.cropRect
        // Fixed-size samples bound CPU/allocation cost even if the device returns a larger frame.
        val width = minOf(32, crop.width())
        val height = minOf(24, crop.height())
        return ByteArray(width * height) { index ->
            val x = crop.left + (index % width) * crop.width() / width
            val y = crop.top + (index / width) * crop.height() / height
            buffer.get(base + y * plane.rowStride + x * plane.pixelStride)
        }
    }
}
